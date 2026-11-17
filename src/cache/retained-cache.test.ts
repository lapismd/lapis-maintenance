import { afterEach, expect, it, vi } from "vitest";
import { MemoryResponseCache } from "./response-cache";
import { RetainedResponseCache } from "./retained-cache";
import { reconcileAttention } from "./retention-policy";
import { viewKey } from "./view-cache";
import { snapshotFixture, detailFixture } from "../../catalog/fixtures";
import { PreviewMap } from "./preview-map";
afterEach(() => vi.restoreAllMocks());
const value = (body: unknown) => ({
  body,
  fetchedAt: Date.now(),
  etag: '"original"',
});

it("keeps whole workflow/event inventory responses in session memory without persisting their ETags", async () => {
  const disk = new MemoryResponseCache(),
    cache = new RetainedResponseCache(disk);
  try {
    for (const key of [
      "json:/repos/o/r/actions/runs?head_sha=a",
      "json:/repos/o/r/events?per_page=100",
      "activity:v1:filters:first",
      "review:v3:o/r:pr:o/r:1:selection:target:activity:",
      "json:/repos/o/r/graphql:query",
    ]) {
      const response = value({
        workflow_runs: [
          { status: "completed", conclusion: "success" },
          { status: "in_progress" },
        ],
      });
      await cache.put(key, response);
      expect(await cache.get(key)).toEqual(response);
      expect(await disk.get(key)).toBeUndefined();
    }
  } finally {
    await cache.close();
  }
});

it("removes resolved entities, checks and references across selections, fencing late writes", async () => {
  const disk = new MemoryResponseCache(),
    cache = new RetainedResponseCache(disk);
  const template = snapshotFixture().items[0]!;
  const item = {
    ...template,
    id: "pr:o/r:2",
    repository: "o/r",
    status: "passed" as const,
    target: { kind: "pull-request" as const, sha: "b".repeat(40) },
  };
  const old = {
    ...item,
    id: "pr:o/r:1",
    target: { ...item.target, sha: "a".repeat(40) },
  };
  const other = { ...item, id: "pr:o/other:1", repository: "o/other" };
  const snapshot = {
    ...snapshotFixture(),
    items: [item, old, other],
    repositories: [
      { repository: "o/r", available: true },
      { repository: "o/other", available: true },
    ],
  };
  const key = viewKey({ additions: ["o/r"], exclusions: [] });
  const expiredKeys = [
    "maintenance-detail:v4:o/r:selection:pr:o/r:1",
    "review:v3:o/r:pr:o/r:1:selection:target:checks:",
    "json:/repos/o/r/pulls/1",
    `json:/repos/o/r/commits/${old.target.sha}/check-runs`,
  ];
  try {
    await cache.put(key, value({ schema: 1, snapshot }));
    for (const k of expiredKeys)
      await cache.put(
        k,
        value(
          k.startsWith("maintenance-detail:")
            ? { schema: 1, detail: detailFixture(old) }
            : { state: "open" },
        ),
      );
    const complete = {
      ...snapshot,
      items: [item],
      repositories: [{ repository: "o/r", available: true }],
    };
    await reconcileAttention(cache, {
      ...complete,
      repositories: [
        { repository: "o/r", available: false, reason: "Rate limited" },
      ],
    });
    expect(await cache.get(expiredKeys[2]!)).toBeDefined();
    await reconcileAttention(cache, complete);
    expect(
      (
        (await cache.get(key))?.body as { snapshot: typeof snapshot }
      ).snapshot.items.map((i) => i.id),
    ).toEqual([item.id, other.id]);
    for (const k of expiredKeys) {
      expect(await disk.get(k)).toBeUndefined();
      await cache.put(
        k,
        value(
          k.startsWith("maintenance-detail:")
            ? { schema: 1, detail: detailFixture(old) }
            : { state: "open" },
        ),
      );
      expect(await disk.get(k)).toBeUndefined();
    }
    await cache.put("json:/repos/o/r/pulls/2", value({ state: "open" }));
    expect(await cache.get("json:/repos/o/r/pulls/2")).toBeDefined();
  } finally {
    await cache.close();
  }
});

it("sweeps old legacy history and expired records on a minute timer, then stops maintenance on disposal", async () => {
  vi.useFakeTimers();
  const disk = new MemoryResponseCache(),
    cache = new RetainedResponseCache(disk);
  try {
    await disk.put("activity:v1:old", value({ events: [] }));
    await disk.put("expired", value("old"));
    await vi.advanceTimersByTimeAsync(86_400_001);
    expect(await disk.get("activity:v1:old")).toBeUndefined();
    expect(await disk.get("expired")).toBeUndefined();
    await cache.close();
    expect(vi.getTimerCount()).toBe(0);
  } finally {
    vi.useRealTimers();
    await cache.close();
  }
});

it("does not retain confirmed closed PR or successful workflow details, and bounds synchronous previews", async () => {
  const disk = new MemoryResponseCache(),
    cache = new RetainedResponseCache(disk);
  try {
    for (const [key, body] of [
      ["json:/repos/o/r/pulls/1", { state: "closed" }],
      [
        "json:/repos/o/r/actions/runs/2",
        { status: "completed", conclusion: "success" },
      ],
      ["review:v3:o/r:pr:o/r:1:overview:", { state: "merged" }],
    ] as const) {
      await cache.put(key, value(body));
      expect(await cache.get(key)).toBeUndefined();
      expect(await disk.get(key)).toBeUndefined();
    }
    const previews = new PreviewMap<string>(100, 1024);
    previews.set("a", "x".repeat(600));
    previews.set("b", "y".repeat(600));
    expect(previews.has("a")).toBe(false);
    expect(previews.get("b")).toHaveLength(600);
  } finally {
    await cache.close();
  }
});
