import { expect, it, vi } from "vitest";
import { IndexedDbResponseCache } from "./indexeddb-cache";
import { openResponseCache } from "./turso-cache";

it("persists bounded browser fallback records across connections and isolates token partitions", async () => {
  const partition = `test-${crypto.randomUUID()}`;
  const first = await IndexedDbResponseCache.open(partition);
  const value = { body: { title: "Cached board" }, fetchedAt: Date.now() };
  await first.put("repo:a:detail", value);
  await first.put("repo:ab:detail", value);
  await first.close();
  const restored = await IndexedDbResponseCache.open(partition);
  expect(await restored.get("repo:a:detail")).toEqual(value);
  const other = await IndexedDbResponseCache.open(`${partition}-other`);
  expect(await other.get("repo:a:detail")).toBeUndefined();
  await Promise.all(
    Array.from({ length: 20 }, (_, n) => restored.put(`parallel-${n}`, value)),
  );
  expect(await restored.get("parallel-19")).toEqual(value);
  await restored.removePrefix("repo:a:");
  expect(await restored.get("repo:a:detail")).toBeUndefined();
  expect(await restored.get("repo:ab:detail")).toEqual(value);
  await restored.put("oversized", { ...value, body: "x".repeat(1_048_577) });
  expect(await restored.get("oversized")).toBeUndefined();
  await restored.clear();
  expect(await restored.get("repo:ab:detail")).toBeUndefined();
  await restored.close();
  await other.clear();
  await other.close();
});

it("uses persistent browser storage when isolation is unavailable and memory when both stores fail", async () => {
  const partition = `test-${crypto.randomUUID()}`;
  const isolated = Object.getOwnPropertyDescriptor(
    globalThis,
    "crossOriginIsolated",
  );
  Object.defineProperty(globalThis, "crossOriginIsolated", {
    value: false,
    configurable: true,
  });
  try {
    const opened = await openResponseCache(partition);
    expect(opened.cache.kind).toBe("indexeddb");
    expect(opened.notice).toContain("browser storage");
    await opened.cache.put("board", {
      body: "retained",
      fetchedAt: Date.now(),
    });
    await opened.cache.close();
    const reloaded = await openResponseCache(partition);
    expect((await reloaded.cache.get("board"))?.body).toBe("retained");
    await reloaded.cache.clear();
    await reloaded.cache.close();
    const unavailable = vi.spyOn(indexedDB, "open").mockImplementation(() => {
      throw new Error("Storage denied");
    });
    try {
      const memory = await openResponseCache(partition);
      expect(memory.cache.kind).toBe("memory");
      expect(memory.notice).toContain("memory cache");
      await memory.cache.close();
    } finally {
      unavailable.mockRestore();
    }
  } finally {
    if (isolated)
      Object.defineProperty(globalThis, "crossOriginIsolated", isolated);
    else Reflect.deleteProperty(globalThis, "crossOriginIsolated");
  }
});

it("evicts old browser records when the byte budget is reached", async () => {
  const cache = await IndexedDbResponseCache.open(
    `test-${crypto.randomUUID()}`,
  );
  try {
    const value = { body: "x".repeat(950_000), fetchedAt: Date.now() };
    for (let n = 0; n < 30; n++) await cache.put(`large-${n}`, value);
    expect(await cache.get("large-0")).toBeUndefined();
    expect((await cache.get("large-29"))?.body).toBe(value.body);
  } finally {
    await cache.clear();
    await cache.close();
  }
});
