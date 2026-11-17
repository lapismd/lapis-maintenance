import type {
  CachedResponse,
  CacheTransform,
  ResponseCache,
} from "./response-cache";

import { PartitionResponseCache } from "./partition-cache";
import {
  MAX_STORE_BYTES,
  MAX_CACHE_ENTRIES,
  MAX_ENTRY_BYTES,
  RETENTION_MS,
  recordBytes,
} from "./limits";
import { migrateRecords } from "./legacy-cache";

interface RecordValue {
  key: string;
  value: CachedResponse;
  bytes: number;
  touched: number;
}
interface Totals {
  bytes: number;
  count: number;
}
const request = <T>(value: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    value.onsuccess = () => resolve(value.result);
    value.onerror = () => reject(value.error);
  });
/** Persistent fallback where threaded Turso cannot start; never stores credentials. */
class IndexedDbStore implements ResponseCache {
  readonly kind = "indexeddb";
  #closed = false;
  private constructor(private db: IDBDatabase) {}
  static async open(name: string) {
    const opening = indexedDB.open(name, 1);
    opening.onupgradeneeded = () => {
      const records = opening.result.createObjectStore("responses", {
        keyPath: "key",
      });
      records.createIndex("touched", "touched");
      opening.result.createObjectStore("totals");
    };
    let expired = false;
    const pending = request(opening);
    void pending
      .then((db) => {
        if (expired) db.close();
      })
      .catch(() => {});
    let timer: ReturnType<typeof setTimeout> | undefined;
    const db = await Promise.race([
      pending,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          expired = true;
          reject(new Error("Browser cache startup timed out"));
        }, 5000);
      }),
    ]).finally(() => clearTimeout(timer));
    const cache = new IndexedDbStore(db);
    db.onversionchange = () => {
      void cache.close();
    };
    try {
      await cache.#removeWhere(
        (record) => record.touched < Date.now() - RETENTION_MS,
        IDBKeyRange.upperBound(Date.now() - RETENTION_MS, true),
      );
      return cache;
    } catch (error) {
      await cache.close();
      throw error;
    }
  }
  async #transaction<T>(
    mode: IDBTransactionMode,
    work: (records: IDBObjectStore, totals: IDBObjectStore) => Promise<T>,
  ): Promise<T | undefined> {
    if (this.#closed) return;
    const tx = this.db.transaction(["responses", "totals"], mode);
    const completed = new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onabort = () =>
        reject(tx.error ?? new Error("Cache transaction aborted"));
      tx.onerror = () => {};
    });
    void completed.catch(() => {});
    try {
      const value = await work(
        tx.objectStore("responses"),
        tx.objectStore("totals"),
      );
      await completed;
      return value;
    } catch (error) {
      try {
        tx.abort();
      } catch {}
      throw error;
    }
  }
  async get(key: string) {
    return this.#transaction("readwrite", async (records, metadata) => {
      const record = (await request(records.get(key))) as
        | RecordValue
        | undefined;
      if (record && record.touched < Date.now() - RETENTION_MS) {
        const totals: Totals = await request(metadata.get("size"));
        await request(records.delete(key));
        if (totals)
          await request(
            metadata.put(
              { bytes: totals.bytes - record.bytes, count: totals.count - 1 },
              "size",
            ),
          );
        return;
      }
      return record?.value;
    });
  }
  async put(key: string, value: CachedResponse) {
    const bytes = recordBytes(key, value);
    if (bytes > MAX_ENTRY_BYTES) {
      await this.remove(key);
      return;
    }
    await this.#transaction("readwrite", async (records, metadata) => {
      const previous = (await request(records.get(key))) as
        | RecordValue
        | undefined;
      const totals: Totals = (await request(metadata.get("size"))) ?? {
        bytes: 0,
        count: 0,
      };
      totals.bytes += bytes - (previous?.bytes ?? 0);
      if (!previous) totals.count++;
      await request(
        records.put({
          key,
          value,
          bytes,
          touched: Date.now(),
        } satisfies RecordValue),
      );
      {
        await new Promise<void>((resolve, reject) => {
          const cursor = records.index("touched").openCursor();
          cursor.onerror = () => reject(cursor.error);
          cursor.onsuccess = () => {
            const current = cursor.result;
            if (
              !current ||
              ((current.value as RecordValue).touched >=
                Date.now() - RETENTION_MS &&
                totals.bytes <= MAX_STORE_BYTES &&
                totals.count <= MAX_CACHE_ENTRIES)
            )
              return resolve();
            totals.bytes -= (current.value as RecordValue).bytes;
            totals.count--;
            current.delete();
            current.continue();
          };
        });
      }
      await request(metadata.put(totals, "size"));
    });
  }
  async #removeWhere(
    matches: (value: RecordValue) => boolean,
    expired?: IDBKeyRange,
  ) {
    await this.#transaction("readwrite", async (records, metadata) => {
      const totals: Totals = (await request(metadata.get("size"))) ?? {
        bytes: 0,
        count: 0,
      };
      await new Promise<void>((resolve, reject) => {
        const cursor = expired
          ? records.index("touched").openCursor(expired)
          : records.openCursor();
        cursor.onerror = () => reject(cursor.error);
        cursor.onsuccess = () => {
          const current = cursor.result;
          if (!current) return resolve();
          const value = current.value as RecordValue;
          if (matches(value)) {
            totals.bytes -= value.bytes;
            totals.count--;
            current.delete();
          }
          current.continue();
        };
      });
      await request(metadata.put(totals, "size"));
    });
  }
  async sweep(transform: CacheTransform) {
    await this.#transaction("readwrite", async (records, metadata) => {
      const rows = (await request(records.getAll())) as RecordValue[];
      const totals: Totals = { bytes: 0, count: 0 };
      for (const row of rows.toSorted((a, b) => b.touched - a.touched)) {
        const value =
          row.touched < Date.now() - RETENTION_MS
            ? undefined
            : transform(row.key, row.value);
        const bytes = value ? recordBytes(row.key, value) : 0;
        if (
          !value ||
          bytes > MAX_ENTRY_BYTES ||
          totals.bytes + bytes > MAX_STORE_BYTES ||
          totals.count >= MAX_CACHE_ENTRIES
        ) {
          await request(records.delete(row.key));
        } else {
          totals.bytes += bytes;
          totals.count++;
          if (value !== row.value || bytes !== row.bytes)
            await request(records.put({ ...row, value, bytes }));
        }
      }
      await request(metadata.put(totals, "size"));
    });
  }
  async remove(key: string) {
    await this.#removeWhere((record) => record.key === key);
  }
  async removePrefix(prefix: string) {
    await this.#removeWhere((record) => record.key.startsWith(prefix));
  }
  async clear() {
    await this.#transaction("readwrite", async (records, totals) => {
      await request(records.clear());
      await request(totals.clear());
    });
  }
  async close() {
    this.#closed = true;
    this.db.close();
  }
}

const sharedName = "lapis-maintenance-cache-shared-v2";
export class IndexedDbResponseCache extends PartitionResponseCache {
  static async open(partition: string) {
    const store = await IndexedDbStore.open(sharedName);
    const cache = new IndexedDbResponseCache(store, partition, () =>
      store.close(),
    );
    try {
      const name = `lapis-maintenance-cache-${partition}`;
      if ((await indexedDB.databases()).some((db) => db.name === name)) {
        const legacy = await IndexedDbStore.open(name);
        try {
          await migrateRecords(legacy, cache);
        } finally {
          await legacy.close();
        }
        indexedDB.deleteDatabase(name);
      }
      return cache;
    } catch (error) {
      await cache.close();
      throw error;
    }
  }
}
/** Legacy databases are considered only by exact app prefix; other apps are untouched. */
export async function cleanLegacyBrowserCaches() {
  for (const { name } of await indexedDB.databases()) {
    if (!name || !/^lapis-maintenance-cache-[a-f0-9]{64}$/.test(name)) continue;
    const opening = indexedDB.open(name);
    const db = await request(opening);
    try {
      const tx = db.transaction("responses", "readonly");
      const last = await request(
        tx.objectStore("responses").index("touched").openCursor(null, "prev"),
      );
      if (
        !last ||
        (last.value as RecordValue).touched < Date.now() - RETENTION_MS
      )
        indexedDB.deleteDatabase(name);
    } finally {
      db.close();
    }
  }
}
