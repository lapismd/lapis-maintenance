import type {
  CommandResult,
  MaintenanceCommand,
  MaintenanceDetail,
} from "../maintenance/types";
import type { GithubWriteTransport } from "./write-transport";
/** Caller freshly verified PR identity, permissions, settings and scheduling state. */
export async function submitAutoMerge(
  writer: GithubWriteTransport,
  command: MaintenanceCommand,
  detail: MaintenanceDetail,
  signal: AbortSignal,
): Promise<CommandResult> {
  const enabling = command.kind === "enable-auto-merge",
    method = command.inputs.mergeMethod;
  if (
    !detail.nodeId ||
    (enabling && (!method || !detail.mergeMethods?.includes(method)))
  )
    return {
      status: "rejected",
      message: "Choose an allowed merge method for the current PR identity.",
    };
  signal.throwIfAborted();
  const operation = enabling
    ? "enablePullRequestAutoMerge"
    : "disablePullRequestAutoMerge";
  const type = enabling
    ? "EnablePullRequestAutoMergeInput"
    : "DisablePullRequestAutoMergeInput";
  const response = await writer.submit(
    "/graphql",
    "POST",
    {
      query: `mutation AutoMerge($input:${type}!) { ${operation}(input:$input) { pullRequest { id headRefOid autoMergeRequest { mergeMethod } } } }`,
      variables: {
        input: {
          pullRequestId: detail.nodeId,
          ...(enabling
            ? {
                expectedHeadOid: command.target.sha,
                mergeMethod: method!.toUpperCase(),
              }
            : {}),
        },
      },
    },
    signal,
  );
  const body = response.body as
    | {
        data?: Record<
          string,
          {
            pullRequest?: {
              id: string;
              headRefOid: string;
              autoMergeRequest?: { mergeMethod: string } | null;
            };
          }
        >;
        errors?: { type?: string; extensions?: { code?: string } }[];
      }
    | undefined;
  const updated = body?.data?.[operation]?.pullRequest;
  if (
    !updated &&
    body?.errors?.length &&
    body.errors.every((error) =>
      [
        "FORBIDDEN",
        "UNAUTHORIZED",
        "NOT_FOUND",
        "INSUFFICIENT_SCOPES",
        "UNPROCESSABLE",
        "UNPROCESSABLE_ENTITY",
        "GRAPHQL_VALIDATION_FAILED",
      ].includes(error.type ?? error.extensions?.code ?? ""),
    )
  )
    return {
      status: "rejected",
      message:
        "GitHub rejected auto-merge. Check Contents write permission, repository settings and branch requirements.",
    };
  if (
    body?.errors?.length ||
    !updated ||
    updated.id !== detail.nodeId ||
    updated.headRefOid !== command.target.sha ||
    (enabling
      ? updated.autoMergeRequest?.mergeMethod !== method!.toUpperCase()
      : updated.autoMergeRequest !== null)
  )
    return {
      status: "uncertain",
      message:
        "GitHub did not confirm the requested auto-merge state for this revision. Inspect the PR; this action will not be replayed.",
    };
  return {
    status: enabling ? "accepted" : "completed",
    message: enabling
      ? "GitHub enabled auto-merge. The PR will merge when GitHub's required checks and reviews are satisfied; it has not been confirmed merged."
      : "GitHub disabled auto-merge. The PR remains open.",
    url: detail.item.url,
  };
}
