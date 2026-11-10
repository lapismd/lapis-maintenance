import {
  type MaintenanceDetail,
  type MaintenanceItem,
} from "../maintenance/types";
import {
  category,
  type GithubCheck,
  type GithubPull,
  type GithubReview,
  type GithubStatus,
} from "./models";
import {
  GithubError,
  type GithubTransport,
  type ReadOptions,
} from "./transport";
import { pullActions, mergeMethods, type GithubAccess } from "./action-policy";
export async function readPull(
  client: GithubTransport,
  repository: string,
  pr: GithubPull,
  signal: AbortSignal,
  options: ReadOptions,
  holdReason?: string,
  access?: GithubAccess,
): Promise<MaintenanceDetail> {
  const root = `/repos/${repository}`;
  const results = await Promise.allSettled([
    client.pages<GithubCheck>(
      `${root}/commits/${pr.head.sha}/check-runs?filter=latest&per_page=100`,
      signal,
      options,
      "check_runs",
    ),
    client.pages<GithubStatus>(
      `${root}/commits/${pr.head.sha}/statuses?per_page=100`,
      signal,
      options,
    ),
    client.pages<GithubReview>(
      `${root}/pulls/${pr.number}/reviews?per_page=100`,
      signal,
      options,
    ),
  ]);
  signal.throwIfAborted();
  for (const result of results)
    if (
      result.status === "rejected" &&
      result.reason instanceof GithubError &&
      result.reason.status === 401
    )
      throw result.reason;
  const checks: MaintenanceDetail["checks"] = [];
  const gaps: string[] = [];
  const runs = results[0],
    statuses = results[1],
    reviews = results[2];
  if (runs.status === "fulfilled") {
    for (const check of runs.value.filter(
      (check) => check.head_sha === pr.head.sha,
    ))
      checks.push({
        name: check.name,
        state:
          check.status !== "completed"
            ? "running"
            : ["success", "neutral", "skipped"].includes(check.conclusion ?? "")
              ? "passed"
              : [
                    "failure",
                    "timed_out",
                    "action_required",
                    "startup_failure",
                  ].includes(check.conclusion ?? "")
                ? "failed"
                : "unknown",
        description:
          check.output?.title ??
          (check.conclusion ? `Conclusion: ${check.conclusion}` : check.status),
      });
  } else gaps.push("Current-revision check runs unavailable.");
  if (statuses.status === "fulfilled") {
    const latest = new Map<string, GithubStatus>();
    for (const status of statuses.value)
      if (
        !latest.has(status.context) ||
        latest.get(status.context)!.id < status.id
      )
        latest.set(status.context, status);
    for (const status of latest.values())
      checks.push({
        name: status.context,
        state:
          status.state === "success"
            ? "passed"
            : status.state === "pending"
              ? "running"
              : "failed",
        description: status.description ?? undefined,
      });
  } else gaps.push("Current-revision commit statuses unavailable.");
  const latestReviews = new Map<string, GithubReview>();
  if (reviews.status === "fulfilled") {
    for (const review of reviews.value.toSorted((a, b) => a.id - b.id))
      if (review.commit_id === pr.head.sha && review.state !== "COMMENTED")
        latestReviews.set(review.user.login, review);
  } else gaps.push("Current-revision reviews unavailable.");
  const changes = [...latestReviews.values()].some(
    (review) => review.state === "CHANGES_REQUESTED",
  );
  const approvals = [...latestReviews.values()].filter(
    (review) => review.state === "APPROVED",
  ).length;
  const cancelled =
    runs.status === "fulfilled" &&
    runs.value.some(
      (check) =>
        check.head_sha === pr.head.sha && check.conclusion === "cancelled",
    );
  const kind = category(
    pr.title,
    repository,
    pr.labels?.map((label) => label.name),
  );
  const hold = kind === "dependency" ? holdReason : undefined;
  const status: MaintenanceItem["status"] = hold
    ? "blocked"
    : checks.some((check) => check.state === "failed")
      ? "failed"
      : pr.draft
        ? "draft"
        : gaps.length || checks.some((check) => check.state === "unknown")
          ? cancelled &&
            !gaps.length &&
            runs.status === "fulfilled" &&
            runs.value
              .filter((check) => check.head_sha === pr.head.sha)
              .every((check) =>
                ["success", "neutral", "skipped", "cancelled"].includes(
                  check.conclusion ?? "",
                ),
              )
            ? "cancelled"
            : "unavailable"
          : changes
            ? "blocked"
            : checks.some((check) => check.state === "running")
              ? "running"
              : cancelled
                ? "cancelled"
                : !approvals || pr.requested_reviewers?.length
                  ? "review-needed"
                  : checks.length
                    ? "passed"
                    : "unavailable";
  const reasons = [
    ...(hold ? [hold] : []),
    ...gaps,
    ...(pr.draft ? ["Draft pull request."] : []),
    ...(changes ? ["Changes requested on this revision."] : []),
    ...(pr.requested_reviewers?.length
      ? [
          `Review requested from ${pr.requested_reviewers.map((user) => user.login).join(", ")}.`,
        ]
      : []),
    ...(!checks.length
      ? ["No current-revision checks reported; merge eligibility is unknown."]
      : []),
    ...(status === "failed" ? ["Current PR revision has failing checks."] : []),
  ];
  if (!reasons.length)
    reasons.push(
      `${approvals} approval(s) on the current revision. Repository rules remain authoritative.`,
    );
  const item: MaintenanceItem = {
    id: `pr:${repository}:${pr.number}`,
    repository,
    title: pr.title,
    number: pr.number,
    kind: "pull-request",
    status,
    category: kind,
    updatedAt: pr.updated_at,
    url: pr.html_url,
    target: { kind: "pull-request", sha: pr.head.sha },
    reasons,
    draft: pr.draft,
    actions: [],
  };
  const detail: MaintenanceDetail = {
    item,
    description: pr.body?.trim() || reasons.join("\n\n"),
    checks,
    review: `${approvals} current-revision approval(s)${changes ? "; changes requested" : ""}. Required reviews and merge rules are evaluated by GitHub.`,
    ref: pr.head.ref,
    baseRef: pr.base.ref,
    mergeable: typeof pr.mergeable === "boolean" ? pr.mergeable : undefined,
    coverage: gaps,
    mergeMethods: access ? mergeMethods(access.repository) : undefined,
  };
  item.actions = pullActions(pr, detail, access);
  return detail;
}
