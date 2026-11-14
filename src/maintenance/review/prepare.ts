import type { ReviewState } from "./types";
import type { ReviewAction, ReviewApproval, ReviewOverview } from "./types";
export function canPrepare(
  kind: ReviewAction,
  overview: ReviewOverview,
  approvals: ReviewApproval[] | undefined,
  targetId: string,
  canApprove: boolean,
  canMerge: boolean,
  resources: ReviewState,
) {
  if (
    ["enable-auto-merge", "disable-auto-merge"].includes(kind) &&
    (resources.overview.loading || resources.overview.error)
  )
    return false;
  if (kind === "approve-pr") return canApprove;
  if (kind === "merge-pr") return canMerge;
  if (
    [
      "enable-auto-merge",
      "disable-auto-merge",
      "mark-ready",
      "request-changes",
      "comment",
      "rerun-failed",
      "cancel-run",
    ].includes(kind)
  )
    return !!overview.actions?.some((a) => a.kind === kind && a.available);
  const approval = approvals?.find((a) => a.id === targetId);
  return (
    approval?.state === "ready" &&
    (kind === "approve-workflow") === (approval.kind === "workflow")
  );
}

export function canApproveReview(
  pr: ReviewOverview | undefined,
  resources: ReviewState,
) {
  return (
    !!pr?.canReview &&
    !resources.overview.loading &&
    !resources.overview.error &&
    pr.state === "open" &&
    !pr.draft &&
    !!resources.checks.data?.length &&
    resources.checks.data.every((c) => !c.sha || c.sha === pr?.sha) &&
    !resources.checks.error &&
    !resources.checks.loading
  );
}
export function canMergeReview(
  pr: ReviewOverview | undefined,
  resources: ReviewState,
) {
  return (
    pr?.kind === "pull-request" &&
    pr.state === "open" &&
    !pr.draft &&
    pr.canMerge &&
    !resources.overview.loading &&
    !resources.overview.error
  );
}
