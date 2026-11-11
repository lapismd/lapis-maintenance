export interface CachedResponse {
  body: unknown;
  etag?: string;
  next?: string;
  fetchedAt: number;
}
export interface ResponseCache {
  readonly kind: "turso" | "memory";
  get(key: string): Promise<CachedResponse | undefined>;
  put(key: string, value: CachedResponse): Promise<void>;
  remove(key: string): Promise<void>;
  removePrefix(prefix: string): Promise<void>;
  clear(): Promise<void>;
  close(): Promise<void>;
}
export class MemoryResponseCache implements ResponseCache {
  readonly kind = "memory";
  #entries = new Map<string, CachedResponse>();
  async get(key: string) {
    return this.#entries.get(key);
  }
  async put(key: string, value: CachedResponse) {
    if (new TextEncoder().encode(JSON.stringify(value)).byteLength > 1_048_576)
      return;
    this.#entries.delete(key);
    this.#entries.set(key, value);
    if (this.#entries.size > 1000)
      this.#entries.delete(this.#entries.keys().next().value!);
  }
  async remove(key: string) {
    this.#entries.delete(key);
  }
  async removePrefix(prefix: string) {
    for (const key of this.#entries.keys())
      if (key.startsWith(prefix)) this.#entries.delete(key);
  }
  async clear() {
    this.#entries.clear();
  }
  async close() {
    this.#entries.clear();
  }
}
