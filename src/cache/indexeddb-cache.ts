import type { CachedResponse, ResponseCache } from "./response-cache";

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
export class IndexedDbResponseCache implements ResponseCache {
  readonly kind = "indexeddb";
  #closed = false;
  private constructor(private db: IDBDatabase) {}
  static async open(partition: string) {
    const opening = indexedDB.open(`lapis-maintenance-cache-${partition}`, 1);
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
    const cache = new IndexedDbResponseCache(db);
    db.onversionchange = () => {
      void cache.close();
    };
    try {
      await cache.#removeWhere(
        (record) => record.touched < Date.now() - 86_400_000,
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
    return this.#transaction("readonly", async (records) => {
      const record = (await request(records.get(key))) as
        | RecordValue
        | undefined;
      return record?.value;
    });
  }
  async put(key: string, value: CachedResponse) {
    const bytes = new TextEncoder().encode(JSON.stringify(value)).byteLength;
    if (bytes > 1_048_576) return;
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
      if (totals.bytes > 25 * 1_048_576 || totals.count > 1000) {
        await new Promise<void>((resolve, reject) => {
          const cursor = records.index("touched").openCursor();
          cursor.onerror = () => reject(cursor.error);
          cursor.onsuccess = () => {
            const current = cursor.result;
            if (
              !current ||
              (totals.bytes <= 25 * 1_048_576 && totals.count <= 1000)
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
  async #removeWhere(matches: (value: RecordValue) => boolean) {
    await this.#transaction("readwrite", async (records, metadata) => {
      const totals: Totals = (await request(metadata.get("size"))) ?? {
        bytes: 0,
        count: 0,
      };
      await new Promise<void>((resolve, reject) => {
        const cursor = records.openCursor();
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
