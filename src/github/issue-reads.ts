import type { OpenIssue } from "../maintenance/types";
import type { GithubTransport, ReadOptions } from "./transport";
interface GithubIssue {
  id: number;
  number: number;
  title: string;
  html_url: string;
  updated_at: string;
  pull_request?: unknown;
  labels: { name: string }[];
}
/** Issues endpoint includes pull requests; they already have an independent authority path. */
export async function readOpenIssues(
  client: GithubTransport,
  repository: string,
  signal: AbortSignal,
  options: ReadOptions,
): Promise<OpenIssue[]> {
  const issues = await client.pages<GithubIssue>(
    `/repos/${repository}/issues?state=open&per_page=100`,
    signal,
    options,
  );
  return issues
    .filter((issue) => !issue.pull_request)
    .map((issue) => ({
      id: issue.id,
      number: issue.number,
      repository,
      title: issue.title,
      url: issue.html_url,
      updatedAt: issue.updated_at,
      category: /compatib|storybook.*support/i.test(
        [issue.title, ...issue.labels.map((l) => l.name)].join(" "),
      )
        ? "compatibility"
        : "product",
    }));
}
