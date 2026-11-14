import type { ReviewCheck, ReviewPage } from "../maintenance/review/types";
import type { GithubTransport, ReadOptions } from "./transport";
import type { GithubCheck, GithubPull, GithubStatus } from "./models";
import { presentPull } from "./pull-presentation";
import { GithubError } from "./transport";
export async function reviewChecks(
  client: GithubTransport,
  repository: string,
  pull: GithubPull,
  signal: AbortSignal,
  options: ReadOptions,
): Promise<ReviewCheck[]> {
  const root = `/repos/${repository}/commits/${pull.head.sha}`;
  const results = await Promise.allSettled([
    client.pages<GithubCheck>(
      `${root}/check-runs?per_page=100`,
      signal,
      options,
      "check_runs",
    ),
    client.pages<GithubStatus>(
      `${root}/statuses?per_page=100`,
      signal,
      options,
    ),
  ]);
  for (const result of results)
    if (result.status === "rejected") throw result.reason;
  const detail = presentPull(repository, pull, [
    results[0],
    results[1],
    { status: "fulfilled", value: [] },
  ]);
  return detail.checks.map((c, i) => ({
    ...c,
    id: c.id ?? `${i}:${c.name}`,
    workflow: c.workflow ?? "Checks",
    description: c.description ?? "",
    sha: pull.head.sha,
  }));
}
interface TimelineEvent {
  id?: number;
  node_id?: string;
  event?: string;
  body?: string;
  state?: string;
  created_at?: string;
  submitted_at?: string;
  commit_id?: string;
  html_url?: string;
  actor?: { login: string; avatar_url?: string };
  user?: { login: string; avatar_url?: string };
  author?: { name?: string; date?: string };
  message?: string;
}
export async function reviewActivity(
  client: GithubTransport,
  repository: string,
  number: number,
  signal: AbortSignal,
  options: ReadOptions,
  cursor?: string,
): Promise<ReviewPage> {
  const page = cursor ? Number(cursor) : 1;
  if (!Number.isSafeInteger(page) || page < 1 || page > 100)
    throw new GithubError(0, "Invalid activity page.");
  const result = await client.page<TimelineEvent>(
    `/repos/${repository}/issues/${number}/timeline?per_page=50&page=${page}`,
    signal,
    options,
  );
  return {
    items: result.items
      .filter((e) =>
        [
          "commented",
          "reviewed",
          "committed",
          "merged",
          "closed",
          "reopened",
          "deployed",
          "head_ref_force_pushed",
        ].includes(e.event ?? ""),
      )
      .map((e, i) => {
        const actor = e.actor ?? e.user,
          date = e.submitted_at ?? e.created_at ?? e.author?.date;
        const event = e.event ?? "updated";
        return {
          id: String(
            e.node_id ?? e.id ?? `${event}:${e.commit_id}:${date}:${i}`,
          ),
          kind:
            event === "reviewed"
              ? "review"
              : event === "committed"
                ? "commit"
                : event === "deployed"
                  ? "deployment"
                  : "comment",
          actor: actor?.login ?? e.author?.name ?? "GitHub",
          avatarUrl: actor?.avatar_url,
          title:
            event === "reviewed"
              ? `reviewed this pull request (${e.state ?? "review"})`
              : event.replaceAll("_", " "),
          body: (e.body ?? e.message ?? e.commit_id ?? "").slice(0, 10000),
          time: date ? new Date(date).toLocaleString() : "Time unavailable",
          url: e.html_url ?? `https://github.com/${repository}/pull/${number}`,
          outcome:
            e.state === "approved" || event === "merged"
              ? "success"
              : e.state === "changes_requested"
                ? "failure"
                : undefined,
        };
      }),
    next: result.next ? String(page + 1) : undefined,
  };
}
