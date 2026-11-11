import { expect, it, vi } from "vitest";
import { GithubReadPort } from "./read-port";
import { GithubTransport } from "./transport";
import { MemoryResponseCache } from "../cache/response-cache";

it("post-command HTTP refresh neither rediscovers defaults nor reads other repositories", async () => {
  const send = vi.fn<typeof fetch>(async (input) => {
    const path = new URL(String(input)).pathname;
    if (path.endsWith("/repositories.json"))
      return Response.json({
        repositories: [{ repository: "owner/a" }, { repository: "owner/b" }],
      });
    if (path.endsWith("/pulls")) return Response.json([]);
    if (path.endsWith("/actions/runs"))
      return Response.json({ workflow_runs: [] });
    if (path.endsWith("/commits/main"))
      return Response.json({ sha: "current" });
    return Response.json({ default_branch: "main" });
  });
  const cache = new MemoryResponseCache();
  const client = new GithubTransport("invented", cache, send);
  const reader = new GithubReadPort(
    client,
    () => ({ additions: [], exclusions: [] }),
    Date.now,
    undefined,
    cache,
  );
  const signal = new AbortController().signal;
  await reader.readSnapshot(signal);
  send.mockClear();
  const patch = await reader.refreshRepository("owner/a", signal);
  expect(patch.repositories.map((row) => row.repository)).toEqual(["owner/a"]);
  expect(send.mock.calls.length).toBeGreaterThan(1);
  expect(
    send.mock.calls.every(
      ([input, init]) =>
        new URL(String(input)).pathname.startsWith("/repos/owner/a") &&
        init?.method === "GET",
    ),
  ).toBe(true);
  client.dispose();
});
