import type { MaintenanceDetail } from "../maintenance/types";
import type { GithubRun } from "./models";
import {
  GithubError,
  type GithubTransport,
  type ReadOptions,
} from "./transport";
interface Job {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  steps?: { name: string; conclusion: string | null }[];
}
/** Load only the selected, identified attempt; inventory reads avoid per-job requests. */
export async function loadWorkflowJobs(
  client: GithubTransport,
  details: MaintenanceDetail[],
  repository: string,
  run: GithubRun,
  signal: AbortSignal,
  options: ReadOptions = {},
) {
  try {
    const jobs = await client.pages<Job>(
      `/repos/${repository}/actions/runs/${run.id}/attempts/${run.run_attempt}/jobs?per_page=100`,
      signal,
      options,
      "jobs",
    );
    if (!jobs.length) return;
    const checks: MaintenanceDetail["checks"] = jobs.map((job) => ({
      name: job.name,
      state:
        job.status !== "completed"
          ? "running"
          : job.conclusion === "success"
            ? "passed"
            : [
                  "failure",
                  "timed_out",
                  "action_required",
                  "startup_failure",
                ].includes(job.conclusion ?? "")
              ? "failed"
              : "unknown",
      description: `Attempt ${run.run_attempt}: ${job.conclusion ?? job.status}${
        job.steps
          ?.filter((step) => step.conclusion === "failure")
          .map((step) => ` · ${step.name}`)
          .join("") ?? ""
      }`,
    }));
    for (const detail of details) detail.checks = checks;
  } catch (error) {
    signal.throwIfAborted();
    if (error instanceof GithubError && error.status === 401) throw error;
    for (const detail of details)
      detail.coverage = [
        ...(detail.coverage ?? []),
        "Job details for this workflow attempt are unavailable.",
      ];
  }
}
