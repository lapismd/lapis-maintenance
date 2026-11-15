import { expect, it, vi } from "vitest";
import { readRepository } from "./repository-reads";
import { GithubTransport } from "./transport";
import { MemoryResponseCache } from "../cache/response-cache";
it("preserves PR activity while reporting unavailable open issue coverage", async () => {
  const sha = "a".repeat(40),
    repository = "example/public";
  const pr = {
    state: "open",
    number: 1,
    title: "Current pull request",
    html_url: `https://github.com/${repository}/pull/1`,
    updated_at: "2026-11-15T20:00:00Z",
    draft: false,
    head: { sha, ref: "update" },
    base: { ref: "main" },
    labels: [],
  };
  const send = vi.fn<typeof fetch>(async (input) => {
    const path = new URL(String(input)).pathname;
    if (path === "/graphql")
      return Response.json({ errors: [{ message: "Use REST fixture" }] });
    if (path.endsWith("/issues")) return Response.json({}, { status: 403 });
    if (path.endsWith("/pulls")) return Response.json([pr]);
    if (path.endsWith("/check-runs")) return Response.json({ check_runs: [] });
    if (path.endsWith("/reviews") || path.endsWith("/statuses"))
      return Response.json([]);
    if (path.endsWith("/actions/runs"))
      return Response.json({ workflow_runs: [] });
    if (path.endsWith("/commits/main")) return Response.json({ sha });
    return Response.json({ full_name: repository, default_branch: "main" });
  });
  const client = new GithubTransport(
    "invented-issue-coverage",
    new MemoryResponseCache(),
    send,
  );
  try {
    const result = await readRepository(
      client,
      { repository },
      new AbortController().signal,
      {},
      Date.now,
    );
    expect(result.coverage.available).toBe(false);
    expect(result.coverage.reason).toContain("Open issue coverage unavailable");
    expect(
      result.details.some((detail) => detail.item.id === `pr:${repository}:1`),
    ).toBe(true);
    expect(result.issues).toEqual([]);
  } finally {
    client.dispose();
  }
});
