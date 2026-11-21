import {
  IndexedDbResponseCache,
  cleanLegacyBrowserCaches,
} from "./indexeddb-cache";
import { ResilientResponseCache } from "./resilient-cache";
import { MemoryResponseCache, type ResponseCache } from "./response-cache";
import { RetainedResponseCache } from "./retained-cache";
import { cleanLegacyFileCaches } from "./legacy-cache";

async function retained(cache: ResponseCache, onFallback: () => void) {
  let cleaned = 0;
  const result = new RetainedResponseCache(
    new ResilientResponseCache(cache, onFallback),
    async () => {
      if (Date.now() - cleaned < 3_600_000) return;
      cleaned = Date.now();
      await Promise.allSettled([
        cleanLegacyBrowserCaches(),
        cleanLegacyFileCaches(),
      ]);
    },
  );
  await result.sweep((_key, value) => value);
  return result;
}

/** Open the token-partitioned browser cache without storing credentials. */
export async function openResponseCache(
  partition: string,
  onFallback: () => void = () => {},
): Promise<{ cache: ResponseCache; notice?: string }> {
  try {
    return {
      cache: await retained(
        await IndexedDbResponseCache.open(partition),
        onFallback,
      ),
    };
  } catch {
    return {
      cache: new RetainedResponseCache(new MemoryResponseCache()),
      notice:
        "Persistent cache unavailable; using a memory cache for this session.",
    };
  }
}
