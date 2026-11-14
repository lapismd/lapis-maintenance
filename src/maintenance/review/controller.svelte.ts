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
    readonly summaries: readonly ReviewOverview[],
    private read: ReviewReadPort,
    private write: ReviewCommandPort,
  ) {}
  get overview() {
    return this.resources.overview.data;
  }
  get feedback() {
    return this.receipt?.itemId === this.selectedId ? this.receipt : null;
  }
  get canApprove() {
    return (
      !!this.overview?.canReview &&
      this.overview.state === "open" &&
      !this.overview.draft &&
      !!this.resources.checks.data?.length &&
      !this.resources.checks.error &&
      !this.resources.checks.loading
    );
  }
  get canMerge() {
    return (
      this.overview?.kind === "pull-request" &&
      this.overview.state === "open" &&
      !this.overview.draft &&
      this.overview.canMerge &&
      !this.resources.overview.loading &&
      !this.resources.overview.error
    );
  }
  async select(id: string) {
    if (this.#disposed || !this.summaries.some((item) => item.id === id))
      return;
    if (this.selectedId === id) return;
    this.#generation++;
    this.#abortReads();
    this.selectedId = id;
    this.tab = "overview";
    this.confirmation = null;
    this.resources = {
      ...emptyReviewState(),
      overview: {
        data: this.summaries.find((item) => item.id === id),
        loading: false,
      },
    };
    await Promise.all([
      this.load("overview"),
      this.load("checks"),
      this.load("approvals"),
    ]);
  }
  setTab(tab: ReviewTab) {
    this.tab = tab;
    const resource = tab === "overview" ? "overview" : tab;
    if (!this.resources[resource].data && !this.resources[resource].loading)
      void this.load(resource);
  }
  async refresh() {
    const resources = new Set<ReviewResource>([
      "overview",
      "checks",
      "approvals",
      ...(this.tab === "activity" ? [this.tab] : []),
    ] as ReviewResource[]);
    await Promise.all([...resources].map((resource) => this.load(resource)));
  }
  async load<K extends ReviewResource>(resource: K, cursor?: string) {
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
      let data = await this.read.read(id, resource, request.signal, { cursor });
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
      this.resources = {
        ...this.resources,
        [resource]: { data, loading: false },
      };
    } catch (error) {
      if (!this.#current(id, generation, resource, request)) return;
      this.resources = {
        ...this.resources,
        [resource]: {
          ...this.resources[resource],
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
      kind === "approve-pr"
        ? !this.canApprove
        : kind === "merge-pr"
          ? !this.canMerge
          : !approval ||
            approval.state !== "ready" ||
            (kind === "approve-workflow") !== (approval.kind === "workflow")
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
      sha: approval?.sha ?? this.overview.sha,
      kind,
      label,
      runId: approval?.runId,
      attempt: approval?.attempt,
      environment: approval?.environment,
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
            "The simulated response was interrupted. Inspect the target before retrying.",
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
