import type {
  CommandResult,
  MaintenanceCommand,
  MaintenanceDetail,
} from "../maintenance/types";
import type { GithubWriteTransport } from "./write-transport";
export async function submitWorkflow(
  writer: GithubWriteTransport,
  command: MaintenanceCommand,
  detail: MaintenanceDetail,
): Promise<CommandResult> {
  const target = command.target;
  if (target.kind === "pull-request")
    return { status: "rejected", message: "Invalid workflow command target." };
  if (
    !Number.isSafeInteger(target.runId) ||
    target.runId < 1 ||
    !Number.isSafeInteger(target.attempt) ||
    (target.attempt ?? 0) < 1
  )
    return {
      status: "rejected",
      message: "Invalid workflow attempt identity.",
    };
  const root = `/repos/${command.repository}/actions/runs/${target.runId}`;
  if (target.kind === "deployment") {
    if (
      !Number.isSafeInteger(target.environmentId) ||
      target.environmentId < 1 ||
      command.itemId !==
        `deployment:${command.repository}:${target.runId}:${target.environmentId}` ||
      !["approve-deployment", "reject-deployment"].includes(command.kind)
    )
      return {
        status: "rejected",
        message: "Invalid pending environment command target.",
      };
    const comment = command.inputs.body?.trim() ?? "";
    if (comment.length > 65_536)
      return {
        status: "rejected",
        message: "The deployment review comment is too long.",
      };
    await writer.submit(`${root}/pending_deployments`, "POST", {
      environment_ids: [target.environmentId],
      state: command.kind === "approve-deployment" ? "approved" : "rejected",
      comment,
    });
    return {
      status: "accepted",
      message: `GitHub accepted the environment ${command.kind === "approve-deployment" ? "approval" : "rejection"}. Workflow completion and publication are not confirmed.`,
      url: detail.item.url,
    };
  }
  if (
    command.itemId !== `run:${command.repository}:${target.runId}` ||
    !["rerun-failed", "cancel-run", "approve-run"].includes(command.kind)
  )
    return { status: "rejected", message: "Invalid workflow command target." };
  await writer.submit(
    `${root}/${command.kind === "rerun-failed" ? "rerun-failed-jobs" : command.kind === "approve-run" ? "approve" : "cancel"}`,
    "POST",
  );
  return {
    status: "accepted",
    message:
      command.kind === "approve-run"
        ? "GitHub accepted workflow approval. CI is not yet complete."
        : command.kind === "rerun-failed"
          ? "GitHub accepted the rerun request. The new attempt is not yet complete."
          : "GitHub accepted cancellation. The workflow may take time to stop.",
    url: detail.item.url,
  };
}
