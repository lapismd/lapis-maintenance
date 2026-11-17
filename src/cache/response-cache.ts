import {
  MAX_CACHE_BYTES,
  MAX_CACHE_ENTRIES,
  MAX_ENTRY_BYTES,
  RETENTION_MS,
  recordBytes,
} from "./limits";
export type CacheTransform = (
  key: string,
  value: CachedResponse,
) => CachedResponse | undefined;

export interface CachedResponse {
  body: unknown;
  etag?: string;
  next?: string;
  fetchedAt: number;
}
export interface ResponseCache {
  readonly kind: "turso" | "indexeddb" | "memory";
  get(key: string): Promise<CachedResponse | undefined>;
  put(key: string, value: CachedResponse): Promise<void>;
  remove(key: string): Promise<void>;
  removePrefix(prefix: string): Promise<void>;
  sweep(transform: CacheTransform): Promise<void>;
  retain?(scope: string, transform: CacheTransform): Promise<void>;
  clear(): Promise<void>;
  close(): Promise<void>;
}
export class MemoryResponseCache implements ResponseCache {
  readonly kind = "memory";
  #entries = new Map<
    string,
    { value: CachedResponse; touched: number; bytes: number }
  >();
  #bytes = 0;
  constructor(
    private budget = MAX_CACHE_BYTES,
    private count = MAX_CACHE_ENTRIES,
    private age = RETENTION_MS,
  ) {}
  async get(key: string) {
    const entry = this.#entries.get(key);
    if (entry && Date.now() - entry.touched > this.age) {
      await this.remove(key);
      return;
    }
    return entry?.value;
  }
  async put(key: string, value: CachedResponse) {
    const bytes = recordBytes(key, value);
    await this.remove(key);
    if (bytes > MAX_ENTRY_BYTES || bytes > this.budget) return;
    this.#entries.set(key, { value, bytes, touched: Date.now() });
    this.#bytes += bytes;
    await this.sweep((_key, entry) => entry);
  }
  async remove(key: string) {
    this.#bytes -= this.#entries.get(key)?.bytes ?? 0;
    this.#entries.delete(key);
  }
  async removePrefix(prefix: string) {
    for (const key of this.#entries.keys())
      if (key.startsWith(prefix)) await this.remove(key);
  }
  async sweep(transform: CacheTransform) {
    for (const [key, entry] of this.#entries) {
      const value =
        Date.now() - entry.touched > this.age
          ? undefined
          : transform(key, entry.value);
      if (!value) await this.remove(key);
      else if (value !== entry.value) {
        const bytes = recordBytes(key, value);
        this.#bytes += bytes - entry.bytes;
        this.#entries.set(key, { ...entry, value, bytes });
      }
    }
    while (this.#bytes > this.budget || this.#entries.size > this.count)
      await this.remove(this.#entries.keys().next().value!);
  }
  async clear() {
    this.#entries.clear();
    this.#bytes = 0;
  }
  async close() {
    this.#entries.clear();
    this.#bytes = 0;
  }
}
