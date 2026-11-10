import { ResilientResponseCache } from "./resilient-cache";
import type { Database } from "@tursodatabase/database-wasm";
import {
  MemoryResponseCache,
  type CachedResponse,
  type ResponseCache,
} from "./response-cache";

/** One database per high-entropy token digest; the database never receives the token. */
export class TursoResponseCache implements ResponseCache {
  readonly kind = "turso";
  #closed = false;
  constructor(private db: Database) {}
  static async open(partition: string): Promise<TursoResponseCache> {
    // Official prebuilt browser entry: 0.8.3's Vite entry fails in its worker pool.
    const { connect } = (await import(
      "@tursodatabase/database-wasm/bundle" as string
    )) as { connect(path: string): Promise<Database> };
    const db = await connect(`lapis-maintenance-${partition}.db`);
    try {
      await db.exec(
        "CREATE TABLE IF NOT EXISTS responses (key TEXT PRIMARY KEY, value TEXT NOT NULL, touched INTEGER NOT NULL)",
      );
      await db.run(
        "DELETE FROM responses WHERE touched < ?",
        Date.now() - 86_400_000,
      );
      return new TursoResponseCache(db);
    } catch (error) {
      await db.close().catch(() => {});
      throw error;
    }
  }
  async get(key: string): Promise<CachedResponse | undefined> {
    if (this.#closed) return;
    const row = (await this.db.get(
      "SELECT value FROM responses WHERE key = ?",
      key,
    )) as { value: string } | undefined;
    if (row) {
      try {
        return JSON.parse(row.value) as CachedResponse;
      } catch {
        await this.remove(key);
      }
    }
  }
  async put(key: string, value: CachedResponse): Promise<void> {
    if (this.#closed) return;
    const json = JSON.stringify(value);
    if (new TextEncoder().encode(json).byteLength > 1_048_576) return;
    await this.db.run(
      "INSERT OR REPLACE INTO responses (key, value, touched) VALUES (?, ?, ?)",
      key,
      json,
      Date.now(),
    );
    let size = (await this.db.get(
      "SELECT COALESCE(SUM(length(CAST(value AS BLOB))), 0) AS bytes, COUNT(*) AS count FROM responses",
    )) as { bytes: number; count: number };
    while (Number(size.bytes) > 25 * 1_048_576 || Number(size.count) > 1000) {
      await this.db.exec(
        "DELETE FROM responses WHERE key IN (SELECT key FROM responses ORDER BY touched ASC LIMIT 100)",
      );
      size = (await this.db.get(
        "SELECT COALESCE(SUM(length(CAST(value AS BLOB))), 0) AS bytes, COUNT(*) AS count FROM responses",
      )) as { bytes: number; count: number };
    }
  }
  async remove(key: string) {
    if (!this.#closed)
      await this.db.run("DELETE FROM responses WHERE key = ?", key);
  }
  async clear() {
    if (!this.#closed) await this.db.exec("DELETE FROM responses");
  }
  async close() {
    if (!this.#closed) {
      this.#closed = true;
      await this.db.close();
    }
  }
}

export async function openResponseCache(
  partition: string,
  onFallback: () => void = () => {},
): Promise<{ cache: ResponseCache; notice?: string }> {
  try {
    if (!globalThis.crossOriginIsolated || !navigator.storage?.getDirectory)
      throw new Error("Persistent cache is unavailable in this browser.");
    let expired = false;
    const opening = TursoResponseCache.open(partition);
    void opening
      .then((cache) => {
        if (expired) return cache.close();
      })
      .catch(() => {});
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const cache = await Promise.race([
        opening,
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            expired = true;
            reject(new Error("Cache startup timed out"));
          }, 10_000);
        }),
      ]);
      return { cache: new ResilientResponseCache(cache, onFallback) };
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return {
      cache: new MemoryResponseCache(),
      notice:
        "Persistent cache unavailable; using a memory cache for this session.",
    };
  }
}
