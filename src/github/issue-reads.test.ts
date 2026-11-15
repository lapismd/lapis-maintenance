import { describe, expect, it, vi } from "vitest";
import { readOpenIssues } from "./issue-reads";
import type { GithubTransport } from "./transport";
describe("open issues", () => {
  it("reads pagination through the transport and excludes pull requests", async () => {
    const issue = {
      id: 1,
      number: 19,
      title: "Storybook 11 compatibility",
      html_url: "https://github.com/example/public/issues/19",
      updated_at: "2026-11-15T20:00:00Z",
      labels: [],
    };
    const pages = vi
      .fn()
      .mockResolvedValue([issue, { ...issue, id: 2, pull_request: {} }]);
    const result = await readOpenIssues(
      { pages } as unknown as GithubTransport,
      "example/public",
      new AbortController().signal,
      {},
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ category: "compatibility", number: 19 });
    expect(pages.mock.calls[0]?.[0]).toBe(
      "/repos/example/public/issues?state=open&per_page=100",
    );
  });
});
