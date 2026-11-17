import {
  MemoryResponseCache,
  type CachedResponse,
  type CacheTransform,
  type ResponseCache,
} from "./response-cache";
import { MAINTENANCE_MS } from "./limits";
import { ephemeralResponse, retainResponse } from "./retention-policy";

/** History is an on-demand, 2 MiB/100-response/5-minute session cache, never disk. */
export class RetainedResponseCache implements ResponseCache {
  #history = new MemoryResponseCache(2 * 1_048_576, 100, 300_000);
  #tail = Promise.resolve();
  #closed = false;
  #policies = new Map<string, CacheTransform>();
  #timer: ReturnType<typeof setInterval>;
  constructor(
    private cache: ResponseCache,
    private cleanup?: () => Promise<unknown>,
  ) {
    this.#timer = setInterval(() => {
      void this.sweep((_key, value) => value).catch(() => {});
    }, MAINTENANCE_MS);
    this.#timer.unref?.();
  }
  get kind() {
    return this.cache.kind;
  }
  #retained(key: string, entry: CachedResponse) {
    let value = retainResponse(key, entry);
    if (!key.startsWith("maintenance-view:"))
      for (const policy of this.#policies.values())
        value = value && policy(key, value);
    return value;
  }
  #run(work: () => Promise<void>) {
    const pending = this.#tail.catch(() => {}).then(work);
    this.#tail = pending.catch(() => {});
    return pending;
  }
  async get(key: string) {
    if (this.#closed) return;
    if (ephemeralResponse(key)) return this.#history.get(key);
    const entry = await this.cache.get(key);
    if (!entry) return;
    const value = this.#retained(key, entry);
    if (!value) await this.remove(key);
    return value;
  }
  put(key: string, value: CachedResponse) {
    return this.#run(async () => {
      if (this.#closed) return;
      const retained = this.#retained(key, value);
      if (retained) await this.cache.put(key, retained);
      else {
        await this.cache.remove(key);
        if (ephemeralResponse(key)) await this.#history.put(key, value);
      }
    });
  }
  remove(key: string) {
    return this.#run(async () => {
      await this.#history.remove(key);
      await this.cache.remove(key);
    });
  }
  removePrefix(prefix: string) {
    return this.#run(async () => {
      await this.#history.removePrefix(prefix);
      await this.cache.removePrefix(prefix);
    });
  }
  sweep(transform: CacheTransform) {
    return this.#run(async () => {
      if (this.#closed) return;
      await this.cache.sweep((key, value) => {
        const retained = retainResponse(key, value);
        return retained && transform(key, retained);
      });
      await this.#history.sweep(transform);
      await this.cleanup?.();
    });
  }
  async retain(scope: string, transform: CacheTransform) {
    this.#policies.set(scope, transform);
  }
  clear() {
    return this.#run(async () => {
      await this.#history.clear();
      await this.cache.clear();
    });
  }
  async close() {
    clearInterval(this.#timer);
    // Block late writes immediately, then retire existing cleanup and storage work.
    this.#closed = true;
    await this.#tail;
    await this.#history.close();
    await this.cache.close();
  }
}
