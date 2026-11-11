import {
  MaintenanceReadError,
  targetKey,
  type CommandResult,
  type MaintenanceCommand,
  type MaintenanceCommandPort,
  type MaintenanceReadPort,
  type MaintenanceDetail,
} from "../src/maintenance/types";
import { detailFixture, snapshotFixture } from "./fixtures";
export type Scenario =
  | "cached-details"
  | "detail-refresh-error"
  | "long-repositories"
  | "passed-workflow"
  | "linked-pr"
  | "populated"
  | "loading"
  | "refreshing"
  | "empty"
  | "disconnected"
  | "partial"
  | "rate-limited"
  | "read-error"
  | "command-failure"
  | "stale-target"
  | "uncertain"
  | "permissions"
  | "accepted";
function pause(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const abort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", abort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", abort, { once: true });
  });
}
/** Catalog-only, per-host state. No fetch, storage, credentials, or real mutations. */
export class MemoryMaintenancePort
  implements MaintenanceReadPort, MaintenanceCommandPort
{
  snapshot = snapshotFixture();
  commands: MaintenanceCommand[] = [];
  reads = 0;
  details = new Map<string, number>();
  constructor(
    public scenario: Scenario = "populated",
    private delay = 120,
  ) {
    if (scenario === "passed-workflow") {
      const run = this.snapshot.items.find((item) => item.id === "failure")!;
      run.status = "passed";
      run.reasons = ["The latest workflow attempt completed successfully."];
      run.actions = [];
    }
    if (scenario === "linked-pr") {
      const pr = this.snapshot.items.find((item) => item.id === "dependency")!;
      const run = this.snapshot.items.find((item) => item.id === "failure")!;
      pr.status = "failed";
      run.target.sha = pr.target.sha;
    }
    if (scenario === "empty") this.snapshot.items = [];
    if (scenario === "long-repositories")
      this.snapshot.repositories.push({
        repository: "lapismd/storybook-addon-visual-delta",
        available: true,
      });
    if (scenario === "partial")
      this.snapshot.repositories.push({
        repository: "stevejuma/jj-store",
        available: false,
        reason: "This demo session cannot access this resource owner.",
      });
    if (scenario === "permissions")
      for (const item of this.snapshot.items)
        item.actions = item.actions.map((a) => ({
          ...a,
          available: false,
          reason: "This session has read access only.",
        }));
  }
  async readSnapshot(signal: AbortSignal) {
    this.reads++;
    if (
      this.scenario === "loading" ||
      (this.scenario === "refreshing" && this.reads > 1)
    )
      await pause(2 ** 30, signal);
    await pause(this.delay, signal);
    if (this.reads === 1 && this.scenario === "read-error")
      throw new MaintenanceReadError(
        "GitHub could not be reached. Retry to reconnect the demo.",
      );
    if (this.reads === 1 && this.scenario === "rate-limited")
      throw new MaintenanceReadError(
        "GitHub rate limit reached. Retry after the reset window.",
        "rate-limit",
      );
    return structuredClone(this.snapshot);
  }
  async refreshRepository(repository: string, signal: AbortSignal) {
    await pause(this.delay, signal);
    return structuredClone({
      items: this.snapshot.items.filter(
        (item) => item.repository === repository,
      ),
      repositories: this.snapshot.repositories.filter(
        (row) => row.repository === repository,
      ),
      fetchedAt: this.snapshot.fetchedAt,
    });
  }
  async readDetails(
    itemId: string,
    signal: AbortSignal,
    options: {
      fresh?: boolean;
      onProgress?: (detail: MaintenanceDetail) => void;
    } = {},
  ) {
    const item = this.snapshot.items.find((i) => i.id === itemId);
    if (!item)
      throw new MaintenanceReadError("This item is no longer available.");
    const count = (this.details.get(itemId) ?? 0) + 1;
    this.details.set(itemId, count);
    if (this.scenario === "stale-target" && count === 2)
      item.target = { ...item.target, sha: "b".repeat(40) };
    const detail = detailFixture(item);
    if (this.scenario === "linked-pr" && item.id === "failure") {
      detail.pullRequest = detailFixture(
        this.snapshot.items.find((value) => value.id === "dependency")!,
      );
    }
    if (
      !options.fresh &&
      ["cached-details", "detail-refresh-error"].includes(this.scenario) &&
      count === 1
    ) {
      options.onProgress?.(structuredClone(detail));
      if (this.scenario === "cached-details") await pause(2 ** 30, signal);
      await pause(500, signal);
      throw new MaintenanceReadError("The connection was interrupted.");
    }
    await pause(this.delay, signal);
    return structuredClone(detail);
  }
  async execute(command: MaintenanceCommand): Promise<CommandResult> {
    this.commands.push(structuredClone(command));
    await pause(this.delay);
    const item = this.snapshot.items.find((i) => i.id === command.itemId);
    if (!item || targetKey(item.target) !== targetKey(command.target))
      return {
        status: "rejected",
        message: "The target changed; refresh and review.",
      };
    if (this.scenario === "uncertain")
      throw new Error("The demo connection closed after submission.");
    if (this.scenario === "command-failure" && this.commands.length === 1)
      return {
        status: "rejected",
        message: "The simulated action failed. Review the target and retry.",
      };
    const accepted =
      command.kind === "dispatch-workflow" ||
      command.kind === "rerun-failed" ||
      this.scenario === "accepted";
    item.status = accepted
      ? "running"
      : command.kind === "mark-ready"
        ? "review-needed"
        : command.kind === "cancel-run"
          ? "cancelled"
          : "passed";
    item.actions =
      command.kind === "approve-pr"
        ? item.actions
            .filter((action) => action.kind === "merge-pr")
            .map((action) => ({
              ...action,
              available: true,
              reason: undefined,
            }))
        : [];
    item.reasons = [
      accepted
        ? "Request accepted; the workflow is still running."
        : "The simulated action completed. No GitHub data changed.",
    ];
    if (command.kind === "merge-pr")
      this.snapshot.items = this.snapshot.items.filter(
        (value) => value.id !== item.id,
      );
    return {
      status: accepted ? "accepted" : "completed",
      message: accepted
        ? "Request accepted. Workflow completion is pending."
        : "Simulated action completed successfully.",
      url: item.url,
    };
  }
}
