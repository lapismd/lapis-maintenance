import type { MaintenanceDetail } from "../maintenance/types";
import type { GithubTransport, ReadOptions } from "./transport";
import type { GithubRun } from "./models";
import type { GithubAccess } from "./action-policy";
import { readWorkflow } from "./workflow-reads";
export async function readWorkflowApprovals(
  client: GithubTransport,
  detail: MaintenanceDetail,
  signal: AbortSignal,
  options: ReadOptions,
  access: GithubAccess,
) {
  const runs = await client.pages<GithubRun>(
    `/repos/${detail.item.repository}/actions/runs?head_sha=${detail.item.target.sha}&per_page=100`,
    signal,
    options,
    "workflow_runs",
  );
  const latest = new Map<number, GithubRun>();
  for (const run of runs.toSorted(
    (a, b) => b.id - a.id || b.run_attempt - a.run_attempt,
  ))
    if (run.head_sha === detail.item.target.sha && !latest.has(run.workflow_id))
      latest.set(run.workflow_id, run);
  const results = await Promise.all(
    [...latest.values()]
      .filter((run) => run.conclusion === "action_required")
      .map((run) =>
        readWorkflow(
          client,
          detail.item.repository,
          run,
          signal,
          options,
          access,
        ),
      ),
  );
  detail.workflowApprovals = results
    .flat()
    .filter((value) => value.item.kind === "workflow")
    .map((value) => ({
      ...value.item,
      title: value.workflow ?? value.item.title,
    }));
}
