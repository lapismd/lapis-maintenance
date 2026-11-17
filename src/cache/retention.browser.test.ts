import { expect, it, vi } from "vitest";
import { TursoResponseCache, openResponseCache } from "./turso-cache";
import { DATABASE_LEASE } from "./database-lease";
import { IndexedDbResponseCache } from "./indexeddb-cache";
import { SqlResponseCache } from "./sql-cache";
import { snapshotFixture } from "../../catalog/fixtures";
import { viewKey } from "./view-cache";

for (const backend of [TursoResponseCache, IndexedDbResponseCache]) {
  it(`${backend.name} shares its byte budget across tokens while clear stays token scoped`, async () => {
    const prefix = crypto.randomUUID(),
      a = await backend.open(`${prefix}-a`),
      b = await backend.open(`${prefix}-b`);
    try {
      const response = { body: "x".repeat(900_000), fetchedAt: Date.now() };
      for (let n = 0; n < 9; n++) await a.put(`a-${n}`, response);
      for (let n = 0; n < 9; n++) await b.put(`b-${n}`, response);
      expect((await a.get("a-0")) === undefined).toBe(true);
      expect((await b.get("b-8"))?.body === response.body).toBe(true);
      await a.clear();
      expect((await b.get("b-8"))?.body === response.body).toBe(true);
      expect(await a.get("b-8")).toBeUndefined();
    } finally {
      await a.clear();
      await b.clear();
      await a.close();
      await b.close();
    }
  });

  it(`${backend.name} expires records within an open connection and sweeps inactive token rows`, async () => {
    let clock = Date.now();
    const now = vi.spyOn(Date, "now").mockImplementation(() => clock);
    const prefix = crypto.randomUUID(),
      a = await backend.open(`${prefix}-a`),
      b = await backend.open(`${prefix}-b`);
    try {
      await a.put("expired", { body: "old", fetchedAt: clock });
      await b.put("expired", { body: "old", fetchedAt: clock });
      clock += 86_400_001;
      expect(await a.get("expired")).toBeUndefined();
      // Sweep one live token: the backend also expires inactive token records.
      await a.sweep((_key, value) => value);
      expect(await b.get("expired")).toBeUndefined();
    } finally {
      now.mockRestore();
      await a.clear();
      await b.clear();
      await a.close();
      await b.close();
    }
  });
}

it("uses persistent fallback immediately when another tab owns Turso, without touching its connection", async () => {
  let release!: () => void, ready!: () => void;
  const acquired = new Promise<void>((resolve) => {
    ready = resolve;
  });
  const closed = new Promise<void>((resolve) => {
    release = resolve;
  });
  const holding = navigator.locks.request(DATABASE_LEASE, async () => {
    ready();
    await closed;
  });
  await acquired;
  const partition = crypto.randomUUID();
  try {
    const result = await openResponseCache(partition);
    expect(result.cache.kind).toBe("indexeddb");
    await result.cache.put("view", {
      body: "own partition",
      fetchedAt: Date.now(),
    });
    expect((await result.cache.get("view"))?.body).toBe("own partition");
    await result.cache.clear();
    await result.cache.close();
  } finally {
    release();
    await holding;
  }
}, 5000);

it("migrates the active legacy Turso partition without reintroducing completed cards, then removes its files", async () => {
  const partition = crypto.randomUUID().replaceAll("-", "").repeat(2);
  const name = `lapis-maintenance-${partition}.db`;
  const legacy = await SqlResponseCache.open(name);
  const snapshot = snapshotFixture(),
    template = snapshot.items[0]!;
  snapshot.items = [
    { ...template, id: "pr:o/r:1", kind: "pull-request", status: "passed" },
    { ...template, id: "run:o/r:2", kind: "workflow", status: "passed" },
  ];
  const key = viewKey({ additions: [], exclusions: [] });
  await legacy.put(key, {
    body: { schema: 1, snapshot },
    fetchedAt: Date.now(),
  });
  await legacy.put("activity:v1:old", {
    body: { events: [] },
    fetchedAt: Date.now(),
  });
  await legacy.close();
  const migrated = await TursoResponseCache.open(partition);
  try {
    const stored = (await migrated.get(key))?.body as {
      snapshot: typeof snapshot;
    };
    expect(stored.snapshot.items.map((item) => item.id)).toEqual(["pr:o/r:1"]);
    expect(await migrated.get("activity:v1:old")).toBeUndefined();
    const root = await navigator.storage.getDirectory();
    await expect(root.getFileHandle(name)).rejects.toThrow();
  } finally {
    await migrated.clear();
    await migrated.close();
  }
});

it("migrates an active legacy IndexedDB partition and leaves other application stores alone", async () => {
  const partition = crypto.randomUUID(),
    name = `lapis-maintenance-cache-${partition}`;
  const open = (dbName: string) =>
    new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(dbName, 1);
      req.onupgradeneeded = () => {
        req.result
          .createObjectStore("responses", { keyPath: "key" })
          .createIndex("touched", "touched");
        req.result.createObjectStore("totals");
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  const legacy = await open(name),
    unrelatedName = `other-app-${partition}`,
    unrelated = await open(unrelatedName);
  const response = { body: "warm data", fetchedAt: Date.now() };
  const tx = legacy.transaction(["responses", "totals"], "readwrite");
  tx.objectStore("responses").put({
    key: "warm",
    value: response,
    touched: Date.now(),
    bytes: 100,
  });
  tx.objectStore("totals").put({ bytes: 100, count: 1 }, "size");
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  legacy.close();
  unrelated.close();
  const migrated = await IndexedDbResponseCache.open(partition);
  try {
    expect(await migrated.get("warm")).toEqual(response);
    expect(
      (await indexedDB.databases()).some((db) => db.name === unrelatedName),
    ).toBe(true);
  } finally {
    await migrated.clear();
    await migrated.close();
    indexedDB.deleteDatabase(unrelatedName);
  }
});
