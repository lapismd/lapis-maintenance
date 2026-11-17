import type {
  CachedResponse,
  CacheTransform,
  ResponseCache,
} from "./response-cache";
/** Logical token isolation inside a globally bounded app-owned backend. */
export class PartitionResponseCache implements ResponseCache {
  #closed = false;
  private prefix: string;
  constructor(
    private store: ResponseCache,
    partition: string,
    private release: () => Promise<void>,
  ) {
    this.prefix = `${partition.length}:${partition}:`;
  }
  get kind() {
    return this.store.kind;
  }
  async get(key: string) {
    if (!this.#closed) return this.store.get(this.prefix + key);
  }
  async put(key: string, value: CachedResponse) {
    if (!this.#closed) await this.store.put(this.prefix + key, value);
  }
  async remove(key: string) {
    if (!this.#closed) await this.store.remove(this.prefix + key);
  }
  async removePrefix(prefix: string) {
    if (!this.#closed) await this.store.removePrefix(this.prefix + prefix);
  }
  async sweep(transform: CacheTransform) {
    if (!this.#closed)
      await this.store.sweep((key, value) =>
        key.startsWith(this.prefix)
          ? transform(key.slice(this.prefix.length), value)
          : value,
      );
  }
  async clear() {
    await this.removePrefix("");
  }
  async close() {
    if (this.#closed) return;
    this.#closed = true;
    await this.release();
  }
}
