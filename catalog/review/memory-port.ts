import type {
  ReviewReadPort,
  ReviewCommandPort,
  ReviewResource,
  ReviewResources,
  ReviewCommand,
} from "../../src/maintenance/review/types";
import {
  reviewSummaries,
  reviewFixture,
  olderEvents,
  type ReviewScenario,
} from "./fixtures";
function pause(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    signal.throwIfAborted();
    const abort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, ms);
    signal.addEventListener("abort", abort, { once: true });
  });
}
/** Disposable fixture host. No credentials, transports or persistence. */
export class MemoryReviewPort implements ReviewReadPort, ReviewCommandPort {
  summaries = reviewSummaries();
  data: Map<string, ReviewResources>;
  commands: ReviewCommand[] = [];
  reads = new Map<string, number>();
  constructor(
    readonly scenario: ReviewScenario = "ready",
    private delay = 80,
  ) {
    this.data = new Map(
      this.summaries.map((item) => [item.id, reviewFixture(item, scenario)]),
    );
  }
  async read<K extends ReviewResource>(
    id: string,
    resource: K,
    signal: AbortSignal,
    options: { cursor?: string } = {},
  ): Promise<ReviewResources[K]> {
    const key = `${id}:${resource}`,
      count = (this.reads.get(key) ?? 0) + 1;
    this.reads.set(key, count);
    if (
      (this.scenario === "loading" && resource !== "overview") ||
      (this.scenario === "refreshing" && count > 1)
    )
      await pause(2 ** 30, signal);
    await pause(this.delay, signal);
    if (
      this.scenario === "resource-error" &&
      resource === "activity" &&
      count === 1
    )
      throw Error(
        "Activity could not be loaded. PR checks and approvals remain available.",
      );
    const data = this.data.get(id);
    if (!data) throw Error("This preview item is no longer available.");
    return structuredClone(
      resource === "activity" && options.cursor
        ? olderEvents(data.overview)
        : data[resource],
    ) as ReviewResources[K];
  }
  async execute(command: ReviewCommand, signal: AbortSignal) {
    this.commands.push(structuredClone(command));
    await pause(Math.max(this.delay, 180), signal);
    const data = this.data.get(command.itemId),
      target = data?.approvals.find((item) => item.id === command.targetId);
    if (
      !data ||
      command.sha !== data.overview.sha ||
      this.scenario === "stale" ||
      (target &&
        (target.attempt !== command.attempt || target.state !== "ready"))
    )
      return {
        status: "rejected" as const,
        message:
          "The target or approval wait changed. Refresh and review it again; nothing was submitted.",
      };
    if (this.scenario === "uncertain")
      return {
        status: "uncertain" as const,
        message:
          "The simulated response was interrupted. Inspect the target before continuing; this action will not be replayed.",
        url: data.overview.url,
      };
    if (command.kind === "approve-pr") {
      data.overview.review = "Approved by demo-maintainer";
      data.overview.canMerge = true;
    }
    if (command.kind === "merge-pr") {
      data.overview.state = "merged";
      data.overview.canMerge = false;
    }
    if (target) {
      target.state = "accepted";
      target.reason =
        command.kind === "reject-environment"
          ? "Rejection recorded in this preview. The protected job will not proceed."
          : "Approval accepted in this preview. Workflow completion is still pending.";
    }
    return {
      status: target ? ("accepted" as const) : ("completed" as const),
      message: target
        ? target.reason
        : command.kind === "merge-pr"
          ? "The displayed PR revision was merged in this preview."
          : "Approval recorded for the displayed revision in this preview.",
      url: target?.url ?? data.overview.url,
    };
  }
}
