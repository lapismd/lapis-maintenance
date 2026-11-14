import type {
  ReviewReadPort,
  ReviewResource,
  ReviewResources,
} from "../maintenance/review/types";
import { ResourceCache } from "../cache/resource-cache";
import type { ResponseCache } from "../cache/response-cache";
import type { GithubReadPort } from "./read-port";
import type { GithubTransport, ReadOptions } from "./transport";
import { GithubError } from "./transport";
import type { GithubPull, GithubRepository, GithubRun } from "./models";
import { validRepository } from "./models";
import { presentPull } from "./pull-presentation";
import { overviewOf, approvalOf } from "./review-mapping";
import { reviewActivity, reviewChecks } from "./review-resources";
import { readWorkflow } from "./workflow-reads";
export class GithubReviewPort implements ReviewReadPort {
  #denied = new Set<string>();
  readonly resources: ResourceCache;
  constructor(
    private client: GithubTransport,
    private reader: GithubReadPort,
    private actor: string,
    private selection: () => string,
    cache?: ResponseCache,
  ) {
    this.resources = new ResourceCache(cache);
  }
  accepts(id: string) {
    return !!this.reader.seed(id) || !!this.identity(id);
  }
  identity(id: string) {
    const match = /^pr:([^:]+):(\d+)$/.exec(id);
    return match && validRepository(match[1]!) && Number(match[2]) > 0
      ? { repository: match[1]!, number: Number(match[2]) }
      : undefined;
  }
  key(id: string, resource: ReviewResource, cursor?: string) {
    const seed = this.reader.seed(id),
      repository = seed?.item.repository ?? this.identity(id)?.repository;
    if (!repository)
      throw new GithubError(
        0,
        "This target is unavailable. Refresh the inbox.",
      );
    return {
      repository,
      key: `review:v1:${repository}:${id}:${this.selection()}:${JSON.stringify(seed?.item.target ?? null)}:${resource}:${cursor ?? ""}`,
    };
  }
  preview(id: string): Partial<ReviewResources> {
    if (this.#denied.has(id)) return {};
    const result: Partial<ReviewResources> = {};
    for (const resource of ["overview", "checks", "approvals"] as const) {
      const { repository, key } = this.key(id, resource);
      const value = this.resources.preview(
        key,
        this.reader.version(repository),
      );
      if (value) Object.assign(result, { [resource]: value });
    }
    result.overview ??= this.reader.seed(id)
      ? overviewOf(this.reader.seed(id)!)
      : undefined;
    return result;
  }
  async context(id: string, signal: AbortSignal, options: ReadOptions) {
    const identity = this.identity(id);
    if (!identity)
      throw new GithubError(0, "A pull request identity is required.");
    const root = `/repos/${identity.repository}`;
    const [pull, metadata] = await Promise.all([
      this.client.read<GithubPull>(
        `${root}/pulls/${identity.number}`,
        signal,
        options,
      ),
      this.client.read<GithubRepository>(root, signal, options),
    ]);
    const access = { login: this.actor, repository: metadata };
    const detail = presentPull(
      identity.repository,
      pull,
      [
        { status: "fulfilled", value: [] },
        { status: "fulfilled", value: [] },
        { status: "fulfilled", value: [] },
      ],
      this.reader.hold(identity.repository),
      access,
    );
    detail.review =
      this.reader.seed(id)?.review ??
      "Review history has not been loaded. GitHub applies repository rules.";
    this.reader.remember(detail);
    return { pull, access, detail, repository: identity.repository };
  }
  async read<K extends ReviewResource>(
    id: string,
    resource: K,
    signal: AbortSignal,
    options: {
      cursor?: string;
      force?: boolean;
      onProgress?: (value: ReviewResources[K]) => void;
    } = {},
  ): Promise<ReviewResources[K]> {
    const { repository, key } = this.key(id, resource, options.cursor);
    try {
      return await this.resources.read(
        key,
        () => this.reader.version(repository),
        async (readOptions, signal) => {
          if (!this.identity(id)) {
            const detail = await this.reader.readDetails(id, signal, {
              fresh: options.force,
            });
            if (resource === "overview") {
              const overview = overviewOf(detail);
              if (detail.pullRequest) {
                this.reader.remember(detail.pullRequest);
                overview.linkedPull = overviewOf(detail.pullRequest);
              }
              return overview as ReviewResources[K];
            }
            if (resource === "checks")
              return detail.checks.map((c, i) => ({
                ...c,
                id: c.id ?? String(i),
                workflow: c.workflow ?? detail.workflow ?? "Checks",
                description: c.description ?? "",
                sha: detail.item.target.sha,
              })) as ReviewResources[K];
            if (resource === "approvals")
              return [approvalOf(detail)].filter(Boolean) as ReviewResources[K];
            return { items: [] } as unknown as ReviewResources[K];
          }
          const { pull, access, detail } = await this.context(
            id,
            signal,
            readOptions,
          );
          if (resource === "overview") {
            this.#denied.delete(id);
            const overview = overviewOf(detail, pull);
            // Reporting checks is enforced independently by the controller and fresh command preflight.
            overview.canReview =
              pull.state === "open" &&
              !pull.draft &&
              pull.user?.login.toLowerCase() !== this.actor.toLowerCase() &&
              !access.repository.archived &&
              !access.repository.disabled;
            overview.actionReason = overview.canReview
              ? undefined
              : "Only another author’s open, ready PR can receive your approval.";
            return overview as ReviewResources[K];
          }
          if (resource === "checks")
            return (await reviewChecks(
              this.client,
              repository,
              pull,
              signal,
              readOptions,
            )) as ReviewResources[K];
          if (resource === "activity")
            return (await reviewActivity(
              this.client,
              repository,
              pull.number,
              signal,
              readOptions,
              options.cursor,
            )) as ReviewResources[K];
          const runs = await this.client.pages<GithubRun>(
            `/repos/${repository}/actions/runs?head_sha=${pull.head.sha}&per_page=100`,
            signal,
            readOptions,
            "workflow_runs",
          );
          const latest = new Map<number, GithubRun>();
          for (const run of runs.toSorted(
            (a, b) => b.id - a.id || b.run_attempt - a.run_attempt,
          ))
            if (run.head_sha === pull.head.sha && !latest.has(run.workflow_id))
              latest.set(run.workflow_id, run);
          const details = (
            await Promise.all(
              [...latest.values()]
                .filter(
                  (r) =>
                    r.status === "waiting" ||
                    r.status === "action_required" ||
                    r.conclusion === "action_required",
                )
                .map((r) =>
                  readWorkflow(
                    this.client,
                    repository,
                    r,
                    signal,
                    readOptions,
                    access,
                  ),
                ),
            )
          ).flat();
          for (const d of details) this.reader.remember(d);
          return details.map(approvalOf).filter(Boolean) as ReviewResources[K];
        },
        signal,
        options,
      );
    } catch (error) {
      if (
        resource === "overview" &&
        error instanceof GithubError &&
        error.discardPreview
      )
        this.#denied.add(id);
      throw error;
    }
  }
  async prefetch(id: string, signal: AbortSignal) {
    await this.read(id, "overview", signal);
    await this.read(id, "checks", signal);
  }
  dispose() {
    this.resources.dispose();
  }
  drain() {
    return this.resources.drain();
  }
}
