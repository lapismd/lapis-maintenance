import type { MaintenanceDetail } from "../maintenance/types";
import { category, type GithubEnvironment, type GithubRun } from "./models";
import {
  futureAction,
  workflowAction,
  type GithubAccess,
} from "./action-policy";
import {
  GithubError,
  type GithubTransport,
  type ReadOptions,
} from "./transport";
export async function readWorkflow(
  client: GithubTransport,
  repository: string,
  run: GithubRun,
  signal: AbortSignal,
  options: ReadOptions,
  access?: GithubAccess,
): Promise<MaintenanceDetail[]> {
  const failed = [
    "failure",
    "timed_out",
    "action_required",
    "startup_failure",
  ].includes(run.conclusion ?? "");
  const running = run.status !== "completed";
  const detail: MaintenanceDetail = {
    item: {
      id: `run:${repository}:${run.id}`,
      repository,
      title: run.display_title || run.name,
      kind: "workflow",
      category: category(run.name, repository),
      status:
        run.conclusion === "action_required"
          ? "approval-wait"
          : running
            ? "running"
            : run.conclusion === "cancelled"
              ? "cancelled"
              : failed
                ? "failed"
                : run.conclusion === "success" || run.conclusion === "skipped"
                  ? "passed"
                  : "unavailable",
      updatedAt: run.updated_at,
      url: run.html_url,
      target: {
        kind: "workflow",
        sha: run.head_sha,
        runId: run.id,
        attempt: run.run_attempt,
      },
      reasons: [
        `${run.name} · attempt ${run.run_attempt} · ${run.conclusion ?? run.status}`,
      ],
      actions:
        run.conclusion === "action_required"
          ? [workflowAction("approve-run", run, access)]
          : running
            ? [workflowAction("cancel-run", run, access)]
            : failed
              ? [workflowAction("rerun-failed", run, access)]
              : [],
    },
    description: `Latest observed attempt of ${run.name}.`,
    workflow: run.name,
    ref: run.head_branch,
    checks: [
      {
        name: run.name,
        state: running
          ? "running"
          : failed
            ? "failed"
            : run.conclusion === "success"
              ? "passed"
              : "unknown",
        description: `Attempt ${run.run_attempt}: ${run.conclusion ?? run.status}`,
      },
    ],
  };
  if (run.status !== "waiting") return [detail];
  try {
    const pending = await client.read<GithubEnvironment[]>(
      `/repos/${repository}/actions/runs/${run.id}/pending_deployments`,
      signal,
      options,
    );
    return [
      detail,
      ...pending.map((wait) => ({
        ...detail,
        item: {
          ...detail.item,
          id: `deployment:${repository}:${run.id}:${wait.environment.id}`,
          kind: "approval" as const,
          status: "approval-wait" as const,
          title: `${run.name} · ${wait.environment.name} approval`,
          target: {
            kind: "deployment" as const,
            sha: run.head_sha,
            runId: run.id,
            environmentId: wait.environment.id,
            attempt: run.run_attempt,
          },
          reasons: [
            `Environment: ${wait.environment.name}`,
            wait.current_user_can_approve
              ? "You can review this deployment in GitHub."
              : "This user cannot approve the pending environment.",
            ...wait.reviewers.map(
              (value) =>
                `Required reviewer: ${value.reviewer.login ?? value.reviewer.name ?? value.type}`,
            ),
          ],
          actions: [
            futureAction("approve-deployment", "Approve deployment"),
            futureAction("reject-deployment", "Reject deployment"),
          ],
        },
        environment: wait.environment.name,
      })),
    ];
  } catch (error) {
    signal.throwIfAborted();
    if (error instanceof GithubError && error.status === 401) throw error;
    detail.coverage = ["Pending environment approval details unavailable."];
    detail.item.reasons.push(...detail.coverage);
    return [detail];
  }
}
