import { afterEach, expect, it, vi } from "vitest";
import { MemoryResponseCache } from "./response-cache";
import { readCachedView, saveCachedView } from "./view-cache";
import { snapshotFixture } from "../../catalog/fixtures";

afterEach(() => vi.restoreAllMocks());

it("persists attention items while dropping completed workflows, retaining open passing PRs", async () => {
  const snapshot = snapshotFixture();
  const template = snapshot.items[0]!;
  snapshot.items = [
    { ...template, id: "run:owner/repo:1", kind: "workflow", status: "passed" },
    {
      ...template,
      id: "run:owner/repo:2",
      kind: "workflow",
      status: "cancelled",
    },
    {
      ...template,
      id: "pr:owner/repo:3",
      kind: "pull-request",
      status: "passed",
    },
    {
      ...template,
      id: "run:owner/repo:4",
      kind: "workflow",
      status: "running",
    },
    { ...template, id: "run:owner/repo:5", kind: "workflow", status: "failed" },
    {
      ...template,
      id: "run:owner/repo:6",
      kind: "workflow",
      status: "unavailable",
    },
  ];
  const cache = new MemoryResponseCache();
  const selection = { additions: [], exclusions: [] };
  await saveCachedView(cache, selection, snapshot);
  const restored = await readCachedView(
    cache,
    selection,
    Date.parse(snapshot.fetchedAt),
  );
  expect(restored?.items.map((item) => item.id)).toEqual([
    "pr:owner/repo:3",
    "run:owner/repo:4",
    "run:owner/repo:5",
    "run:owner/repo:6",
  ]);
  expect(restored?.repositories).toEqual(snapshot.repositories);
});

it("bounds memory by bytes rather than allowing 1000 one-MiB records", async () => {
  const cache = new MemoryResponseCache();
  const value = { body: "x".repeat(950_000), fetchedAt: Date.now() };
  for (let i = 0; i < 30; i++) await cache.put(`large-${i}`, value);
  expect(await cache.get("large-0")).toBeUndefined();
  expect(await cache.get("large-29")).toEqual(value);
});

it("expires data in an already open cache without requiring a reload", async () => {
  let clock = Date.now();
  vi.spyOn(Date, "now").mockImplementation(() => clock);
  const cache = new MemoryResponseCache();
  await cache.put("old", { body: "expired", fetchedAt: clock });
  clock += 86_400_001;
  expect(await cache.get("old")).toBeUndefined();
});
