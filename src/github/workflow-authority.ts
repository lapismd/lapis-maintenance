import type { ActionCapability } from "../maintenance/types";
import type { GithubPull, GithubRun } from "./models";
import { workflowAction, type GithubAccess } from "./action-policy";
import {
  GithubError,
  type GithubTransport,
  type ReadOptions,
} from "./transport";
export const approvalWaiting = (run: GithubRun) =>
  run.status === "action_required" || run.conclusion === "action_required";
/** GitHub can require PR-run approval for fork and same-repository automation branches. */
export async function workflowApproval(
  client: GithubTransport,
  repository: string,
  run: GithubRun,
  signal: AbortSignal,
  options: ReadOptions,
  access?: GithubAccess,
): Promise<ActionCapability> {
  const action = workflowAction("approve-run", run, access);
  if (!action.available || !access) return action;
  const denied = (reason: string) => ({ ...action, available: false, reason });
  if (run.event !== "pull_request" || access.repository.private !== false)
    return denied(
      "PR workflow approval requires a verified public repository and pull_request event.",
    );
  try {
    let pr: GithubPull | undefined;
    if (run.pull_requests.length === 1) {
      pr = await client.read<GithubPull>(
        `/repos/${repository}/pulls/${run.pull_requests[0]!.number}`,
        signal,
        options,
      );
    } else if (run.pull_requests.length === 0) {
      const pulls = await client.pages<GithubPull>(
        `/repos/${repository}/pulls?state=open&per_page=100`,
        signal,
        options,
      );
      const matching = pulls.filter(
        (value) =>
          value.state === "open" &&
          value.head.sha === run.head_sha &&
          value.head.ref === run.head_branch,
      );
      if (matching.length === 1) pr = matching[0];
    }
    if (
      !pr ||
      pr.state !== "open" ||
      pr.head.sha !== run.head_sha ||
      pr.head.ref !== run.head_branch
    )
      return denied(
        "The open PR, current revision and branch could not be matched unambiguously to this workflow attempt.",
      );
    const head = pr.head.repo,
      base = pr.base.repo;
    if (
      !head ||
      !base ||
      head.private !== false ||
      base.private !== false ||
      base.full_name.toLowerCase() !== repository.toLowerCase()
    )
      return denied(
        "The public PR source or base repository could not be verified for this workflow target.",
      );
    return action;
  } catch (error) {
    signal.throwIfAborted();
    if (error instanceof GithubError && error.status === 401) throw error;
    return denied(
      `The workflow PR revision could not be verified: ${error instanceof Error ? error.message : "PR read failed."}`,
    );
  }
}
