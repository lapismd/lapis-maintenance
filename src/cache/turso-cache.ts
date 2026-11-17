import {
  IndexedDbResponseCache,
  cleanLegacyBrowserCaches,
} from "./indexeddb-cache";
import { ResilientResponseCache } from "./resilient-cache";
import { MemoryResponseCache, type ResponseCache } from "./response-cache";
import { PartitionResponseCache } from "./partition-cache";
import { SharedCacheStore } from "./shared-store";
import { SqlResponseCache } from "./sql-cache";
import { RetainedResponseCache } from "./retained-cache";
import { migrateLegacyFiles, cleanLegacyFiles } from "./legacy-cache";
import { databaseLease } from "./database-lease";
const shared = new SharedCacheStore(async () => {
  const release = await databaseLease();
  try {
    return await SqlResponseCache.open(
      "lapis-maintenance-shared-v2.db",
      release,
    );
  } catch (error) {
    await release();
    throw error;
  }
});
/** A logical token partition; both persistent backends share fixed app-wide budgets. */
export class TursoResponseCache extends PartitionResponseCache {
  static async open(partition: string) {
    const owned = await shared.acquire();
    const cache = new TursoResponseCache(owned.store, partition, owned.release);
    try {
      await migrateLegacyFiles(partition, cache);
      return cache;
    } catch (error) {
      await cache.close();
      throw error;
    }
  }
}

async function retained(cache: ResponseCache, onFallback: () => void) {
  let cleaned = 0;
  const result = new RetainedResponseCache(
    new ResilientResponseCache(cache, onFallback),
    async () => {
      if (Date.now() - cleaned < 3_600_000) return;
      cleaned = Date.now();
      await Promise.allSettled([
        cleanLegacyFiles(),
        cleanLegacyBrowserCaches(),
      ]);
    },
  );
  await result.sweep((_key, value) => value);
  return result;
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
      return {
        cache: await retained(cache, onFallback),
      };
    } finally {
      clearTimeout(timer);
    }
  } catch {
    try {
      const cache = await IndexedDbResponseCache.open(partition);
      return {
        cache: await retained(cache, onFallback),
        notice:
          "Turso is unavailable in this browser; data is cached on this device using browser storage.",
      };
    } catch {}
    return {
      cache: new RetainedResponseCache(new MemoryResponseCache()),
      notice:
        "Persistent cache unavailable; using a memory cache for this session.",
    };
  }
}
