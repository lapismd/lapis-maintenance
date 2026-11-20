import { expect, it, vi } from "vitest";
import { branchActions } from "./branch-actions";
import { readWorkflowInventory } from "./workflow-inventory";
import { GithubTransport } from "./transport";
import { MemoryResponseCache } from "../cache/response-cache";
import type { GithubRun } from "./models";
const sha = "a".repeat(40);
const run = (value: Partial<GithubRun> = {}): GithubRun => ({
  id: 1,
  workflow_id: 1,
  name: "CI",
  display_title: "CI",
  html_url: "https://github.com/a/b/actions/runs/1",
  head_sha: sha,
  head_branch: "main",
  run_attempt: 1,
  status: "completed",
  conclusion: "success",
  event: "push",
  updated_at: "2026-11-15T20:00:00Z",
  pull_requests: [],
  ...value,
});
it.each([
  ["passed", [run()]],
  ["failed", [run(), run({ id: 2, workflow_id: 2, conclusion: "failure" })]],
  ["pending", [run({ status: "in_progress", conclusion: null })]],
  ["pending", [run({ status: "completed", conclusion: "action_required" })]],
  ["failed", [run({ conclusion: "cancelled" })]],
  ["unknown", []],
  ["unknown", [run({ conclusion: "unexpected" })]],
] as const)("summarizes %s for the current branch revision", (state, runs) => {
  expect(branchActions("main", sha, [...runs], true).state).toBe(state);
});
it("qualifies current push workflows without unrelated same-revision runs", () => {
  const result = branchActions(
    "main",
    sha,
    [
      run({ id: 1, run_attempt: 1, conclusion: "failure" }),
      run({ id: 1, run_attempt: 2 }),
      run({ id: 20, workflow_id: 2, head_sha: "old", conclusion: "failure" }),
      run({
        id: 21,
        workflow_id: 3,
        head_branch: "feature",
        conclusion: "failure",
      }),
      run({
        id: 22,
        workflow_id: 4,
        event: "pull_request",
        conclusion: "failure",
      }),
      run({
        id: 23,
        workflow_id: 5,
        event: "pull_request_target",
        conclusion: "failure",
      }),
      run({
        id: 24,
        workflow_id: 6,
        event: "schedule",
        conclusion: "failure",
      }),
      run({
        id: 25,
        workflow_id: 7,
        event: "workflow_dispatch",
        conclusion: "failure",
      }),
      run({
        id: 26,
        workflow_id: 8,
        event: "workflow_run",
        conclusion: "failure",
      }),
    ],
    true,
  );
  expect(result).toMatchObject({
    state: "passed",
    branch: "main",
    sha,
    workflows: 1,
  });
  expect(branchActions("main", sha, [run()], false).state).toBe("unknown");
  expect(branchActions("main", undefined, [run()], true).state).toBe("unknown");
});
it("reuses current-head inventory and isolates unrelated query failures without extra GitHub requests", async () => {
  const send = vi.fn<typeof fetch>(async (input) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith("/commits/trunk")) return Response.json({ sha });
    if (url.searchParams.get("head_sha") === sha)
      return Response.json({ workflow_runs: [run({ head_branch: "trunk" })] });
    return Response.json({}, { status: 403 });
  });
  const cache = new MemoryResponseCache();
  const client = new GithubTransport("invented", cache, send);
  const signal = new AbortController().signal;
  try {
    const result = await readWorkflowInventory(
      client,
      "a/b",
      "trunk",
      [],
      signal,
      {},
    );
    expect(result.actions).toMatchObject({
      state: "passed",
      branch: "trunk",
      sha,
      workflows: 1,
    });
    expect(result.gaps).toHaveLength(2);
    expect(send).toHaveBeenCalledTimes(4);
    await client.drain();
    await readWorkflowInventory(client, "a/b", "trunk", [], signal, {});
    // Only denied wait queries repeat; successful head/run responses remain cached.
    expect(
      send.mock.calls.filter(([input]) =>
        new URL(String(input)).searchParams.has("head_sha"),
      ),
    ).toHaveLength(1);
  } finally {
    client.dispose();
  }
});
