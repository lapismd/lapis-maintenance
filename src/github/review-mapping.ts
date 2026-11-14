import type { MaintenanceDetail } from "../maintenance/types";
import type {
  ReviewOverview,
  ReviewApproval,
} from "../maintenance/review/types";
import type { GithubPull } from "./models";
export function overviewOf(
  detail: MaintenanceDetail,
  pull?: GithubPull,
): ReviewOverview {
  const { item } = detail;
  const capability = (kind: string) =>
    item.actions.find((a) => a.kind === kind);
  return {
    id: item.id,
    kind: item.kind,
    repository: item.repository,
    number: item.number ?? 0,
    title: item.title,
    url: item.url,
    author: pull?.user?.login ?? "GitHub Actions",
    sha: item.target.sha,
    target: item.target,
    head: detail.ref ?? "",
    base: detail.baseRef ?? "",
    description: detail.description,
    labels: pull?.labels?.map((l) => l.name) ?? [],
    review: detail.review ?? item.reasons.join(" "),
    draft: !!item.draft,
    state:
      pull?.state === "closed"
        ? pull.merged_at
          ? "merged"
          : "closed"
        : "open",
    canReview: !!capability("approve-pr")?.available,
    canMerge: !!capability("merge-pr")?.available,
    actionReason: capability("approve-pr")?.reason,
    mergeReason: capability("merge-pr")?.reason,
    mergeMethods: detail.mergeMethods,
    actions: item.actions,
    additions: pull?.additions ?? 0,
    deletions: pull?.deletions ?? 0,
  };
}
export function approvalOf(
  detail: MaintenanceDetail,
): ReviewApproval | undefined {
  const { item } = detail,
    target = item.target;
  if (target.kind !== "workflow" && target.kind !== "deployment") return;
  const action = item.actions.find(
    (a) =>
      a.kind ===
      (target.kind === "workflow" ? "approve-run" : "approve-deployment"),
  );
  if (!action) return;
  return {
    id: item.id,
    kind: target.kind === "workflow" ? "workflow" : "environment",
    title: item.title,
    url: item.url,
    runId: target.runId,
    attempt: target.attempt ?? 1,
    sha: target.sha,
    environment: detail.environment,
    state: action.available ? "ready" : "denied",
    reason: action.reason ?? item.reasons.join(" "),
    permission:
      target.kind === "workflow"
        ? "Actions: write"
        : "Deployments: write and eligible environment reviewer",
    target,
  };
}
