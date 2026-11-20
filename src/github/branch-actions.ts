import type { GithubRun } from "./models";
import type {
  RepositoryActions,
  RepositoryActionState,
} from "../maintenance/repository-actions";
import { approvalWaiting } from "./workflow-authority";
function runState(run: GithubRun): RepositoryActionState {
  if (approvalWaiting(run)) return "pending";
  if (run.status !== "completed")
    return [
      "queued",
      "in_progress",
      "waiting",
      "pending",
      "requested",
    ].includes(run.status)
      ? "pending"
      : "unknown";
  if (
    ["failure", "cancelled", "timed_out", "startup_failure", "stale"].includes(
      run.conclusion ?? "",
    )
  )
    return "failed";
  return ["success", "neutral", "skipped"].includes(run.conclusion ?? "")
    ? "passed"
    : "unknown";
}
/** Summary of complete existing inventory; never schedules a badge-specific read. */
export function branchActions(
  branch: string,
  sha: string | undefined,
  runs: GithubRun[],
  complete: boolean,
): RepositoryActions {
  const latest = new Map<number, GithubRun>();
  for (const run of runs.toSorted(
    (a, b) => b.id - a.id || b.run_attempt - a.run_attempt,
  )) {
    if (
      run.head_sha !== sha ||
      run.head_branch !== branch ||
      run.event !== "push"
    )
      continue;
    if (!latest.has(run.workflow_id)) latest.set(run.workflow_id, run);
  }
  const states = [...latest.values()].map(runState);
  const state =
    !complete || !sha || !states.length
      ? "unknown"
      : (["failed", "pending", "unknown", "passed"] as const).find((state) =>
          states.includes(state),
        )!;
  return {
    branch,
    sha,
    state,
    workflows: latest.size,
    reason:
      !complete || !sha
        ? "Current branch workflow coverage is unavailable."
        : !states.length
          ? "No workflows reported for the current branch revision."
          : `${latest.size} push workflow${latest.size === 1 ? "" : "s"} at revision ${sha.slice(0, 8)}.`,
  };
}
