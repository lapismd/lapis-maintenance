import { expect, it, vi } from "vitest";
import { GithubTransport } from "./transport";
import { MemoryResponseCache } from "../cache/response-cache";
import { readLinkedPull } from "./linked-pull";
import type { GithubPull, GithubRun } from "./models";
const sha = "a".repeat(40);
const pull: GithubPull = {
  number: 7,
  state: "open",
  title: "Dependency update",
  html_url: "https://github.com/owner/repo/pull/7",
  updated_at: "2026-11-10T00:00:00Z",
  draft: false,
  head: { sha, ref: "update" },
  base: { ref: "main" },
  labels: [],
};
const run = { pull_requests: [{ number: 7 }], head_sha: sha } as GithubRun;
it("requires one open PR at the observed workflow head before exposing its review target", async () => {
  const send = vi.fn<typeof fetch>(async (input) => {
    const path = new URL(String(input)).pathname;
    return Response.json(
      path.endsWith("/pulls/7")
        ? pull
        : path.endsWith("/check-runs")
          ? { check_runs: [] }
          : [],
    );
  });
  const client = new GithubTransport(
    "invented-test-token",
    new MemoryResponseCache(),
    send,
  );
  const detail = await readLinkedPull(
    client,
    "owner/repo",
    run,
    new AbortController().signal,
  );
  expect(detail?.item.target).toEqual({ kind: "pull-request", sha });
  expect(detail?.item.id).toBe("pr:owner/repo:7");
  expect(detail?.item.actions.every((action) => !action.available)).toBe(true);
  expect(send.mock.calls.every((call) => call[1]?.method === "GET")).toBe(true);
});
it.each([
  { ...pull, head: { ...pull.head, sha: "changed" } },
  { ...pull, state: "closed" },
])("rejects changed or closed associated PRs", async (pr) => {
  const send = vi.fn<typeof fetch>().mockResolvedValue(Response.json(pr));
  const client = new GithubTransport("test", new MemoryResponseCache(), send);
  expect(
    await readLinkedPull(
      client,
      "owner/repo",
      run,
      new AbortController().signal,
    ),
  ).toBeUndefined();
  expect(send).toHaveBeenCalledTimes(1);
});
it("does not choose merge authority for an unassociated or ambiguous run", async () => {
  const send = vi.fn<typeof fetch>();
  const client = new GithubTransport("test", new MemoryResponseCache(), send);
  for (const pull_requests of [[], [{ number: 7 }, { number: 8 }]])
    expect(
      await readLinkedPull(
        client,
        "owner/repo",
        { ...run, pull_requests },
        new AbortController().signal,
      ),
    ).toBeUndefined();
  expect(send).not.toHaveBeenCalled();
});
