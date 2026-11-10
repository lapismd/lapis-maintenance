import {
  MemoryResponseCache,
  type CachedResponse,
  type ResponseCache,
} from "./response-cache";
/** Disk failures degrade reads to memory; explicit cleanup still reports disk failures. */
export class ResilientResponseCache implements ResponseCache {
  #memory = new MemoryResponseCache();
  #failed = false;
  constructor(
    private persistent: ResponseCache,
    private onFallback: () => void,
  ) {}
  get kind() {
    return this.#failed ? ("memory" as const) : this.persistent.kind;
  }
  #fallback() {
    if (!this.#failed) {
      this.#failed = true;
      this.onFallback();
    }
  }
  async get(key: string): Promise<CachedResponse | undefined> {
    if (!this.#failed) {
      try {
        const value = await this.persistent.get(key);
        if (value) await this.#memory.put(key, value);
        return value;
      } catch {
        this.#fallback();
      }
    }
    return this.#memory.get(key);
  }
  async put(key: string, value: CachedResponse) {
    await this.#memory.put(key, value);
    if (!this.#failed)
      try {
        await this.persistent.put(key, value);
      } catch {
        this.#fallback();
      }
  }
  async remove(key: string) {
    await this.#memory.remove(key);
    if (!this.#failed)
      try {
        await this.persistent.remove(key);
      } catch {
        this.#fallback();
      }
  }
  async clear() {
    await this.#memory.clear();
    await this.persistent.clear();
  }
  async close() {
    await this.#memory.close();
    await this.persistent.close();
  }
}
