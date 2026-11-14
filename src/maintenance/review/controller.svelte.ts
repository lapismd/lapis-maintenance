import { canPrepare, canApproveReview, canMergeReview } from "./prepare";
import {
  emptyReviewState,
  type ReviewOverview,
  type ReviewReadPort,
  type ReviewCommandPort,
  type ReviewResource,
  type ReviewResources,
  type ReviewTab,
  type ReviewState,
  type ReviewAction,
  type ReviewCommand,
} from "./types";
import type { CommandResult } from "../types";
export class ReviewController {
  selectedId = $state<string | null>(null);
  tab = $state<ReviewTab>("overview");
  workspaceOpen = $state(false);
  resources = $state.raw<ReviewState>(emptyReviewState());
  confirmation = $state.raw<ReviewCommand | null>(null);
  pending = $state(false);
  receipt = $state.raw<{
    itemId: string;
    label: string;
    result: CommandResult;
  } | null>(null);
  #generation = 0;
  #sequence = 0;
  #disposed = false;
  #reads = new Map<string, AbortController>();
  #command?: AbortController;
  constructor(
    private source:
      | readonly ReviewOverview[]
      | (() => readonly ReviewOverview[]),
    private read: ReviewReadPort,
    private write: ReviewCommandPort,
    readonly mode: "preview" | "live" = "preview",
  ) {}
  get summaries() {
    return typeof this.source === "function" ? this.source() : this.source;
  }
  get overview() {
    return this.resources.overview.data;
  }
  get pullRequest() {
    return this.overview?.kind === "pull-request"
      ? this.overview
      : this.overview?.linkedPull;
  }
  get feedback() {
    return this.receipt?.itemId === this.selectedId ? this.receipt : null;
  }
  get canApprove() {
    return canApproveReview(this.pullRequest, this.resources);
  }
  get canMerge() {
    return canMergeReview(this.pullRequest, this.resources);
  }
  async select(id: string) {
    if (
      this.#disposed ||
      (!this.read.accepts?.(id) &&
        !this.summaries.some((item) => item.id === id))
    )
      return;
    if (this.selectedId === id) {
      await Promise.all([
        this.load("overview"),
        this.load("checks"),
        this.load("approvals"),
      ]);
      return;
    }
    this.#generation++;
    this.#abortReads();
    this.selectedId = id;
    this.tab = "overview";
    this.confirmation = null;
    const preview = this.read.preview?.(id);
    this.resources = {
      ...emptyReviewState(),
      overview: {
        data:
          preview?.overview ?? this.summaries.find((item) => item.id === id),
        loading: false,
      },
    };
    if (preview)
      for (const key of ["checks", "approvals"] as const)
        if (preview[key])
          this.resources = {
            ...this.resources,
            [key]: { data: preview[key], loading: false },
          };
    await this.load("overview");
    if (this.selectedId === id)
      await Promise.all([this.load("checks"), this.load("approvals")]);
  }
  setTab(tab: ReviewTab) {
    this.tab = tab;
    const resource = tab === "overview" ? "overview" : tab;
    if (!this.resources[resource].data && !this.resources[resource].loading)
      void this.load(resource);
  }
  async refresh() {
    await this.load("overview", undefined, true);
    const resources = new Set<ReviewResource>([
      "checks",
      "approvals",
      ...(this.tab === "activity" ? [this.tab] : []),
    ] as ReviewResource[]);
    await Promise.all(
      [...resources].map((resource) => this.load(resource, undefined, true)),
    );
  }
  async load<K extends ReviewResource>(
    resource: K,
    cursor?: string,
    force = false,
  ) {
    const id = this.selectedId,
      generation = this.#generation;
    if (!id || this.#disposed) return;
    this.#reads.get(resource)?.abort();
    const request = new AbortController();
    this.#reads.set(resource, request);
    this.resources = {
      ...this.resources,
      [resource]: {
        ...this.resources[resource],
        loading: true,
        error: undefined,
      },
    };
    try {
      let data = await this.read.read(id, resource, request.signal, {
        cursor,
        force,
        onProgress: (data) => {
          if (this.#current(id, generation, resource, request))
            this.resources = {
              ...this.resources,
              [resource]: { data, loading: true },
            };
        },
      });
      if (!this.#current(id, generation, resource, request)) return;
      if (resource === "activity" && cursor) {
        const page = data as ReviewResources["activity"];
        data = {
          ...page,
          items: [
            ...(this.resources.activity.data?.items ?? []),
            ...page.items,
          ],
        } as ReviewResources[K];
      }
      if (
        resource === "overview" &&
        this.overview?.sha !== (data as ReviewOverview).sha
      )
        this.resources = {
          ...this.resources,
          checks: { loading: false },
          approvals: { loading: false },
        };
      this.resources = {
        ...this.resources,
        [resource]: { data, loading: false },
      };
    } catch (error) {
      if (!this.#current(id, generation, resource, request)) return;
      this.resources = {
        ...this.resources,
        [resource]: {
          ...(error instanceof Error &&
          "discardPreview" in error &&
          error.discardPreview
            ? {}
            : this.resources[resource]),
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "This section could not be loaded.",
        },
      };
    }
  }
  prepare(kind: ReviewAction, targetId: string, label: string) {
    if (this.#disposed || this.pending || !this.overview) return;
    const approval = this.resources.approvals.data?.find(
      (item) => item.id === targetId,
    );
    if (
      !canPrepare(
        kind,
        targetId === this.pullRequest?.id ? this.pullRequest : this.overview,
        this.resources.approvals.data,
        targetId,
        this.canApprove,
        this.canMerge,
      )
    )
      return;
    if (
      this.feedback?.result.status === "uncertain" &&
      this.receipt?.label === label
    )
      return;
    this.confirmation = {
      requestId: `review-${++this.#sequence}`,
      itemId: this.overview.id,
      targetId,
      target:
        approval?.target ??
        (targetId === this.pullRequest?.id
          ? this.pullRequest.target
          : this.overview.target),
      sha: approval?.sha ?? this.overview.sha,
      kind,
      label,
      runId: approval?.runId,
      attempt: approval?.attempt,
      environment: approval?.environment,
      mergeMethod:
        kind === "merge-pr"
          ? (this.pullRequest?.mergeMethods?.[0] ?? "squash")
          : undefined,
    };
  }
  cancel() {
    if (!this.pending) this.confirmation = null;
  }
  async confirm(comment = "") {
    const command = this.confirmation;
    if (this.#disposed || this.pending || !command) return;
    this.pending = true;
    this.#command = new AbortController();
    try {
      let result: CommandResult;
      try {
        result = await this.write.execute(
          { ...command, comment },
          this.#command.signal,
        );
      } catch {
        result = {
          status: "uncertain",
          message:
            "The response was interrupted. Inspect the target before retrying.",
        };
      }
      if (this.#disposed) return;
      this.receipt = { itemId: command.itemId, label: command.label, result };
      this.confirmation = null;
      if (this.selectedId === command.itemId && result.status !== "uncertain")
        await this.refresh();
    } finally {
      this.pending = false;
    }
  }
  close() {
    this.workspaceOpen = false;
  }
  clearSelection() {
    this.#generation++;
    this.#abortReads();
    this.selectedId = null;
    this.resources = emptyReviewState();
    this.confirmation = null;
  }
  dispose() {
    this.#disposed = true;
    this.#abortReads();
    this.#command?.abort();
  }
  #abortReads() {
    for (const request of this.#reads.values()) request.abort();
    this.#reads.clear();
  }
  #current(
    id: string,
    generation: number,
    key: string,
    request: AbortController,
  ) {
    return (
      !this.#disposed &&
      !request.signal.aborted &&
      id === this.selectedId &&
      generation === this.#generation &&
      this.#reads.get(key) === request
    );
  }
}
