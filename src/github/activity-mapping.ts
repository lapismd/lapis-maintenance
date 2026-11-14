import type { ActivityEvent } from "../maintenance/activity/types";
import type { MaintenanceSnapshot } from "../maintenance/types";
interface User {
  login: string;
  avatar_url?: string;
}
export interface RepositoryEvent {
  id: string;
  type: string;
  actor: User;
  created_at: string;
  payload: {
    action?: string;
    ref?: string;
    head?: string;
    size?: number;
    pull_request?: {
      number: number;
      title: string;
      html_url: string;
      state: string;
      merged?: boolean;
      draft?: boolean;
    };
    issue?: {
      number: number;
      title: string;
      html_url: string;
      pull_request?: unknown;
    };
    comment?: { body: string; html_url: string };
    review?: { body?: string; state: string; html_url: string };
    commits?: { sha: string; message: string }[];
  };
}
export function eventOf(
  repository: string,
  event: RepositoryEvent,
): ActivityEvent | undefined {
  const p = event.payload,
    pr = p.pull_request,
    issue = p.issue;
  const number = pr?.number ?? (issue?.pull_request ? issue.number : undefined);
  const common = {
    id: `event:${repository}:${event.id}`,
    actor: event.actor.login,
    avatarUrl: event.actor.avatar_url,
    repository,
    createdAt: event.created_at,
    time: new Date(event.created_at).toLocaleString(),
    itemId: number ? `pr:${repository}:${number}` : "",
  };
  const url =
    pr?.html_url ?? issue?.html_url ?? `https://github.com/${repository}`;
  switch (event.type) {
    case "PullRequestEvent":
      return {
        ...common,
        kind: "pull-request",
        status: pr?.merged ? "passed" : pr?.draft ? "draft" : "review-needed",
        title: `${p.action ?? "updated"} a pull request`,
        body: pr?.title ?? "Pull request updated",
        url,
        outcome: pr?.merged ? "success" : undefined,
      };
    case "PullRequestReviewEvent":
      return {
        ...common,
        kind: "review",
        status: p.review?.state === "approved" ? "passed" : "review-needed",
        title: `reviewed a pull request (${p.review?.state ?? "review"})`,
        body: p.review?.body ?? pr?.title ?? "Review submitted",
        url: p.review?.html_url ?? url,
        outcome:
          p.review?.state === "approved"
            ? "success"
            : p.review?.state === "changes_requested"
              ? "failure"
              : undefined,
      };
    case "IssueCommentEvent":
    case "PullRequestReviewCommentEvent":
      return {
        ...common,
        kind: "comment",
        status: "review-needed",
        title: "commented",
        body: p.comment?.body?.slice(0, 10000) ?? "Comment updated",
        url: p.comment?.html_url ?? url,
      };
    case "PushEvent":
      return {
        ...common,
        kind: "commit",
        status: "passed",
        title: `pushed to ${p.ref?.replace("refs/heads/", "") ?? "a branch"}`,
        body:
          p.commits
            ?.map((c) => c.message)
            .join("\n")
            .slice(0, 10000) || "Branch updated",
        url: p.head ? `https://github.com/${repository}/commit/${p.head}` : url,
      };
    default:
      return;
  }
}
export function observations(
  snapshot: MaintenanceSnapshot | null,
): ActivityEvent[] {
  return (snapshot?.items ?? []).flatMap((item) =>
    item.kind === "pull-request"
      ? []
      : [
          {
            id: `observation:${item.id}:${item.target.sha}:${item.updatedAt}`,
            repository: item.repository,
            itemId: item.id,
            kind:
              item.kind === "approval"
                ? ("deployment" as const)
                : ("workflow" as const),
            actor: "GitHub Actions",
            title: "current status observation",
            body: `${item.title} · ${item.reasons.join(" ")}`,
            createdAt: item.updatedAt,
            time: new Date(item.updatedAt).toLocaleString(),
            url: item.url,
            status: item.status,
            outcome:
              item.status === "failed"
                ? ("failure" as const)
                : item.status === "passed"
                  ? ("success" as const)
                  : undefined,
          },
        ],
  );
}
