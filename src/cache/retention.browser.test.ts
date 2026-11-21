import { expect, it, vi } from "vitest";
import { IndexedDbResponseCache } from "./indexeddb-cache";

for (const backend of [IndexedDbResponseCache]) {
  it(`${backend.name} shares its byte budget across tokens while clear stays token scoped`, async () => {
    const prefix = crypto.randomUUID(),
      a = await backend.open(`${prefix}-a`),
      b = await backend.open(`${prefix}-b`);
    try {
      const response = { body: "x".repeat(900_000), fetchedAt: Date.now() };
      for (let n = 0; n < 16; n++) await a.put(`a-${n}`, response);
      for (let n = 0; n < 16; n++) await b.put(`b-${n}`, response);
      expect((await a.get("a-0")) === undefined).toBe(true);
      expect((await b.get("b-15"))?.body === response.body).toBe(true);
      await a.clear();
      expect((await b.get("b-15"))?.body === response.body).toBe(true);
      expect(await a.get("b-15")).toBeUndefined();
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
