import { expect, it, vi } from "vitest";
import { GithubActivityPort } from "./activity-port";
import { GithubTransport } from "./transport";
import { MemoryResponseCache } from "../cache/response-cache";
import type { MaintenanceSnapshot } from "../maintenance/types";
const query = { search: "", repositories: [], statuses: [], kinds: [] };
it("merges real event streams in time order and resumes cached pages without duplicates or invented totals", async () => {
  const send = vi.fn<typeof fetch>(async (input) => {
    const url = new URL(String(input)),
      repo = url.pathname.includes("/a/") ? "a" : "b",
      page = Number(url.searchParams.get("page"));
    return Response.json(
      Array.from({ length: 60 }, (_, i) => ({
        id: `${repo}-${page}-${i}`,
        type: "PullRequestEvent",
        actor: { login: repo },
        created_at: new Date(
          Date.UTC(2026, 10, 14, 12) - i * 2000 - (repo === "b" ? 1000 : 0),
        ).toISOString(),
        payload: {
          action: "opened",
          pull_request: {
            number: i + 1,
            title: `PR ${i}`,
            html_url: `https://github.com/org/${repo}/pull/${i + 1}`,
            state: "open",
          },
        },
      })),
    );
  });
  const cache = new MemoryResponseCache(),
    client = new GithubTransport("invented", cache, send),
    snapshot: MaintenanceSnapshot = {
      items: [],
      repositories: [
        { repository: "org/a", available: true },
        { repository: "org/b", available: true },
      ],
      fetchedAt: new Date().toISOString(),
    };
  const port = new GithubActivityPort(client, () => snapshot, cache),
    signal = new AbortController().signal;
  const first = await port.readPage(query, undefined, signal);
  expect(first.events).toHaveLength(50);
  expect(first.totalKnown).toBe(false);
  expect(send).toHaveBeenCalledTimes(2);
  const second = await port.readPage(query, first.nextCursor, signal);
  expect(second.events).toHaveLength(50);
  expect(
    new Set([...first.events, ...second.events].map((e) => e.id)).size,
  ).toBe(100);
  expect(send).toHaveBeenCalledTimes(2);
  await port.readPage(query, undefined, signal);
  expect(send).toHaveBeenCalledTimes(2);
  await expect(
    port.readPage({ ...query, search: "different" }, first.nextCursor, signal),
  ).rejects.toThrow("filters changed");
  port.dispose();
  client.dispose();
  await port.drain();
});
it("labels observations honestly and filters event types before emission", async () => {
  const send = vi.fn<typeof fetch>(async () => Response.json([])),
    client = new GithubTransport("invented", new MemoryResponseCache(), send);
  const snapshot: MaintenanceSnapshot = {
    items: [
      {
        id: "run:org/a:1",
        repository: "org/a",
        kind: "workflow",
        title: "CI",
        category: "product",
        status: "failed",
        reasons: ["failure"],
        target: { kind: "workflow", sha: "a".repeat(40), runId: 1, attempt: 1 },
        updatedAt: new Date().toISOString(),
        url: "https://github.com/org/a/actions/runs/1",
        actions: [],
      },
    ],
    repositories: [{ repository: "org/a", available: true }],
    fetchedAt: new Date().toISOString(),
  };
  const port = new GithubActivityPort(client, () => snapshot),
    signal = new AbortController().signal;
  const page = await port.readPage(
    { ...query, kinds: ["workflow"] },
    undefined,
    signal,
  );
  expect(page.events[0]?.title).toBe("current status observation");
  expect(page.events[0]?.outcome).toBe("failure");
  expect(
    (await port.readPage({ ...query, kinds: ["comment"] }, undefined, signal))
      .events,
  ).toEqual([]);
  port.dispose();
  client.dispose();
});
