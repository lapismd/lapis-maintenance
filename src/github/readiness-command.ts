import type { CommandResult, MaintenanceDetail } from "../maintenance/types";
import type { GithubWriteTransport } from "./write-transport";
/** The caller already re-read this identified draft without cache. */
export async function submitReadiness(
  writer: GithubWriteTransport,
  detail: MaintenanceDetail,
): Promise<CommandResult> {
  if (!detail.nodeId || !detail.item.draft)
    return {
      status: "rejected",
      message: "The identified PR is no longer a verified draft. Refresh it.",
    };
  const result = await writer.submit("/graphql", "POST", {
    query:
      "mutation Ready($id: ID!) { markPullRequestReadyForReview(input: {pullRequestId: $id}) { pullRequest { isDraft headRefOid } } }",
    variables: { id: detail.nodeId },
  });
  const body = result.body as
    | {
        data?: {
          markPullRequestReadyForReview?: {
            pullRequest?: { isDraft: boolean; headRefOid: string };
          };
        };
        errors?: { type?: string; extensions?: { code?: string } }[];
      }
    | undefined;
  const updated = body?.data?.markPullRequestReadyForReview?.pullRequest;
  if (
    !updated &&
    body?.errors?.length &&
    body.errors.every((error) =>
      [
        "FORBIDDEN",
        "UNAUTHORIZED",
        "NOT_FOUND",
        "INSUFFICIENT_SCOPES",
        "GRAPHQL_VALIDATION_FAILED",
      ].includes(error.type ?? error.extensions?.code ?? ""),
    )
  )
    return {
      status: "rejected",
      message:
        "GitHub rejected readiness. Check token permissions and the current PR state.",
    };
  if (
    body?.errors?.length ||
    !updated ||
    updated.headRefOid !== detail.item.target.sha
  )
    return {
      status: "uncertain",
      message:
        "Readiness was not confirmed for the displayed revision. Inspect GitHub; this action will not be replayed.",
    };
  return updated.isDraft
    ? {
        status: "rejected",
        message: "GitHub still reports this PR as a draft.",
      }
    : {
        status: "completed",
        message: "The PR is ready for review.",
        url: detail.item.url,
      };
}
