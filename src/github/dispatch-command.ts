import type { MaintenanceCommand, CommandResult } from "../maintenance/types";
import type { GithubWriteTransport } from "./write-transport";
import type { DispatchReads } from "./dispatch-reads";
import { validateInputs } from "./dispatch-model";
export async function submitDispatch(
  reads: DispatchReads,
  writer: GithubWriteTransport,
  command: MaintenanceCommand,
  signal: AbortSignal,
): Promise<CommandResult> {
  const target = command.target;
  if (
    target.kind !== "dispatch" ||
    !Number.isSafeInteger(target.workflowId) ||
    target.workflowId < 1 ||
    command.itemId !== `dispatch:${command.repository}:${target.workflowId}` ||
    (command.inputs.ref !== undefined && command.inputs.ref !== target.ref) ||
    !/^refs\/(heads|tags)\/.+/.test(target.ref)
  )
    throw new Error("Invalid workflow dispatch identity.");
  const root = `/repos/${command.repository}`;
  const workflow = {
    id: target.workflowId,
    name: target.name,
    path: target.path,
    url: target.url,
    inputs: [],
  };
  const ref = {
    name: target.ref.replace(/^refs\/(heads|tags)\//, ""),
    kind: target.ref.startsWith("refs/heads/")
      ? ("branch" as const)
      : ("tag" as const),
    ref: target.ref,
    sha: target.sha,
  };
  const current = await reads.target(
    command.repository,
    workflow,
    ref,
    signal,
    { fresh: true, priority: "interactive" },
  );
  if (
    current.ref.sha !== target.sha ||
    current.definitionSha !== target.definitionSha ||
    current.defaultDefinitionSha !== target.defaultDefinitionSha
  )
    return {
      status: "rejected",
      message:
        "The branch/tag commit or workflow definition changed. Review the operation again.",
    };
  const inputs = validateInputs(
    current.inputs,
    command.inputs.workflowInputs ?? {},
    current.environments,
  );
  const runs = await reads.client.page<{ id: number }>(
    `${root}/actions/workflows/${target.workflowId}/runs?event=workflow_dispatch&per_page=20`,
    signal,
    { fresh: true },
    "workflow_runs",
  );
  const previous = new Set(runs.items.map((r) => r.id)),
    started = Date.now();
  signal.throwIfAborted();
  const response = await writer.submit(
    `${root}/actions/workflows/${target.workflowId}/dispatches`,
    "POST",
    { ref: target.ref, inputs },
    signal,
  );
  const body = response.body as
    | { html_url?: string; workflow_run_id?: number }
    | undefined;
  if (
    body?.workflow_run_id &&
    body.html_url?.startsWith(
      `https://github.com/${command.repository}/actions/runs/`,
    )
  )
    return {
      status: "accepted",
      message:
        "Workflow dispatch accepted. Execution and publication are not yet confirmed.",
      url: body.html_url,
    };
  try {
    const page = await reads.client.page<{
      id: number;
      head_sha: string;
      created_at: string;
      html_url: string;
    }>(
      `${root}/actions/workflows/${target.workflowId}/runs?event=workflow_dispatch&per_page=20`,
      signal,
      { fresh: true },
      "workflow_runs",
    );
    const candidates = page.items.filter(
      (r) =>
        !previous.has(r.id) &&
        r.head_sha === target.sha &&
        Date.parse(r.created_at) >= started - 2000,
    );
    if (candidates.length === 1)
      return {
        status: "accepted",
        message:
          "Workflow dispatch accepted; one matching new run was found. Execution and publication are not confirmed.",
        url: candidates[0]!.html_url,
      };
  } catch {
    /* Never resubmit a successfully accepted dispatch to find its run. */
  }
  return {
    status: "accepted",
    message:
      "Workflow dispatch accepted. Its run has not been uniquely identified yet; inspect the workflow. Publication is not confirmed.",
    url: target.url,
  };
}
