import { expect, it, vi } from "vitest";
import { readRepository } from "./repository-reads";
import { GithubTransport } from "./transport";
import { MemoryResponseCache } from "../cache/response-cache";
import { preserveUnverified } from "../maintenance/attention";
import { snapshotFixture } from "../../catalog/fixtures";

it("removes completed workflow cards from live inventory while preserving branch health and open PRs", async () => {
  const sha = "a".repeat(40),
    time = new Date().toISOString();
  const runs = ["success", "failure", null, "cancelled"].map(
    (conclusion, i) => ({
      id: i + 10,
      workflow_id: i + 1,
      name: `Workflow ${i}`,
      display_title: `Workflow ${i}`,
      html_url: `https://github.com/o/r/actions/runs/${i + 10}`,
      head_sha: sha,
      head_branch: "main",
      run_attempt: 1,
      status: conclusion ? "completed" : "in_progress",
      conclusion,
      updated_at: time,
      pull_requests: [],
      event: "push",
    }),
  );
  const pull = {
    state: "open",
    number: 1,
    title: "Ready to merge",
    html_url: "https://github.com/o/r/pull/1",
    updated_at: time,
    draft: false,
    head: { sha, ref: "feature" },
    base: { ref: "main" },
    user: { login: "author" },
    labels: [],
  };
  const send = vi.fn<typeof fetch>(async (input) => {
    const url = new URL(String(input)),
      path = url.pathname;
    if (path === "/graphql")
      return Response.json({ errors: [{ message: "REST fallback" }] });
    if (path === "/repos/o/r")
      return Response.json({
        default_branch: "main",
        permissions: { push: true },
        private: false,
      });
    if (path.endsWith("/pulls")) return Response.json([pull]);
    if (path.endsWith("/pulls/1")) return Response.json(pull);
    if (path.endsWith("/issues")) return Response.json([]);
    if (path.endsWith("/reviews"))
      return Response.json([
        {
          id: 1,
          user: { login: "reviewer" },
          commit_id: sha,
          state: "APPROVED",
        },
      ]);
    if (path.endsWith("/check-runs"))
      return Response.json({
        check_runs: [
          {
            id: 1,
            name: "CI",
            head_sha: sha,
            status: "completed",
            conclusion: "success",
          },
        ],
      });
    if (path.endsWith("/statuses")) return Response.json([]);
    if (path.endsWith("/commits/main")) return Response.json({ sha });
    if (path.endsWith("/actions/runs"))
      return Response.json({
        workflow_runs: url.searchParams.has("head_sha") ? runs : [],
      });
    throw Error(`Unexpected fixture path ${path}`);
  });
  const client = new GithubTransport(
    "invented",
    new MemoryResponseCache(),
    send,
  );
  try {
    const result = await readRepository(
      client,
      { repository: "o/r" },
      new AbortController().signal,
      {},
      Date.now,
      "maintainer",
    );
    expect(result.coverage.available).toBe(true);
    expect(result.coverage.actions).toMatchObject({
      branch: "main",
      state: "failed",
      workflows: 4,
    });
    expect(result.details.map((d) => [d.item.id, d.item.status])).toEqual([
      ["pr:o/r:1", "passed"],
      ["run:o/r:12", "running"],
      ["run:o/r:11", "failed"],
    ]);
  } finally {
    client.dispose();
    await client.drain();
  }
});

it("retains unverified attention rows when partial coverage omits them", () => {
  const previous = snapshotFixture(),
    item = previous.items[0]!;
  const partial = {
    ...previous,
    items: [],
    repositories: [
      { repository: item.repository, available: false, reason: "Rate limited" },
    ],
  };
  expect(
    preserveUnverified(partial, previous).items.map((i) => i.id),
  ).toContain(item.id);
  expect(
    preserveUnverified(
      {
        ...partial,
        repositories: [{ repository: item.repository, available: true }],
      },
      previous,
    ).items,
  ).toEqual([]);
});
