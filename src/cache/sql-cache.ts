import type { Database } from "@tursodatabase/database-wasm";
import type {
  CachedResponse,
  CacheTransform,
  ResponseCache,
} from "./response-cache";
import {
  MAX_STORE_BYTES,
  MAX_CACHE_ENTRIES,
  MAX_ENTRY_BYTES,
  RETENTION_MS,
  recordBytes,
} from "./limits";

/** All tokens share one quota. Operations serialize sweep/write and connection retirement. */
export class SqlResponseCache implements ResponseCache {
  readonly kind = "turso";
  #tail: Promise<unknown> = Promise.resolve();
  #closed = false;
  private constructor(
    private db: Database,
    private release: () => Promise<void>,
  ) {}
  static async open(name: string, release = async () => {}) {
    const { connect } = (await import(
      "@tursodatabase/database-wasm/bundle" as string
    )) as { connect(path: string): Promise<Database> };
    const db = await connect(name);
    try {
      await db.exec(
        "CREATE TABLE IF NOT EXISTS responses (key TEXT PRIMARY KEY, value TEXT NOT NULL, touched INTEGER NOT NULL)",
      );
      const cache = new SqlResponseCache(db, release);
      await cache.sweep((_key, value) => value);
      return cache;
    } catch (error) {
      await db.close();
      throw error;
    }
  }
  #run<T>(work: () => Promise<T>) {
    const pending = this.#tail.catch(() => {}).then(work);
    this.#tail = pending.catch(() => {});
    return pending;
  }
  async get(key: string): Promise<CachedResponse | undefined> {
    return this.#run(async () => {
      if (this.#closed) return;
      const row = (await this.db.get(
        "SELECT value, touched FROM responses WHERE key = ?",
        key,
      )) as { value: string; touched: number } | undefined;
      if (!row) return;
      if (Number(row.touched) >= Date.now() - RETENTION_MS) {
        try {
          return JSON.parse(row.value) as CachedResponse;
        } catch {}
      }
      await this.db.run("DELETE FROM responses WHERE key = ?", key);
    });
  }
  async put(key: string, value: CachedResponse) {
    await this.#run(async () => {
      if (this.#closed) return;
      if (recordBytes(key, value) > MAX_ENTRY_BYTES) {
        await this.db.run("DELETE FROM responses WHERE key = ?", key);
        return;
      }
      await this.db.run(
        "INSERT OR REPLACE INTO responses (key, value, touched) VALUES (?, ?, ?)",
        key,
        JSON.stringify(value),
        Date.now(),
      );
      await this.#trim();
    });
  }
  async #trim() {
    await this.db.run(
      "DELETE FROM responses WHERE touched < ?",
      Date.now() - RETENTION_MS,
    );
    let size = (await this.db.get(
      "SELECT COALESCE(SUM(length(CAST(value AS BLOB)) + length(CAST(key AS BLOB))), 0) AS bytes, COUNT(*) AS count FROM responses",
    )) as { bytes: number; count: number };
    while (
      Number(size.bytes) > MAX_STORE_BYTES ||
      Number(size.count) > MAX_CACHE_ENTRIES
    ) {
      await this.db.exec(
        "DELETE FROM responses WHERE key IN (SELECT key FROM responses ORDER BY touched ASC, rowid ASC LIMIT 1)",
      );
      size = (await this.db.get(
        "SELECT COALESCE(SUM(length(CAST(value AS BLOB)) + length(CAST(key AS BLOB))), 0) AS bytes, COUNT(*) AS count FROM responses",
      )) as typeof size;
    }
  }
  async remove(key: string) {
    await this.#run(async () => {
      if (!this.#closed)
        await this.db.run("DELETE FROM responses WHERE key = ?", key);
    });
  }
  async removePrefix(prefix: string) {
    await this.#run(async () => {
      if (!this.#closed)
        await this.db.run(
          "DELETE FROM responses WHERE substr(key, 1, ?) = ?",
          prefix.length,
          prefix,
        );
    });
  }
  async sweep(transform: CacheTransform) {
    await this.#run(async () => {
      if (this.#closed) return;
      await this.#trim();
      const rows = (await this.db.all("SELECT key, value FROM responses")) as {
        key: string;
        value: string;
      }[];
      for (const row of rows) {
        let next: CachedResponse | undefined;
        try {
          next = transform(row.key, JSON.parse(row.value));
        } catch {}
        if (!next || recordBytes(row.key, next) > MAX_ENTRY_BYTES)
          await this.db.run("DELETE FROM responses WHERE key = ?", row.key);
        else if (JSON.stringify(next) !== row.value)
          await this.db.run(
            "UPDATE responses SET value = ? WHERE key = ?",
            JSON.stringify(next),
            row.key,
          );
      }
      await this.#trim();
    });
  }
  async clear() {
    await this.removePrefix("");
  }
  async close() {
    await this.#run(async () => {
      if (this.#closed) return;
      this.#closed = true;
      try {
        await this.db.close();
      } finally {
        await this.release();
      }
    });
  }
}
