import { MaintenanceReadError } from "../maintenance/types";
import type { ReadOptions } from "../github/transport";
import type { ResponseCache } from "./response-cache";
import { PreviewMap } from "./preview-map";
interface Retained {
  value: unknown;
  fetchedAt: number;
  version: number;
}
/** Token-partitioned host storage for independently loaded presentation resources. */
export class ResourceCache {
  #invalidated = new Set<string>();
  #epochs = new Map<string, number>();
  #values = new PreviewMap<Retained>();
  #lifetime = new AbortController();
  #writing: Promise<void> = Promise.resolve();
  constructor(
    private cache?: ResponseCache,
    private now = Date.now,
  ) {}
  preview<T>(key: string, version: number): T | undefined {
    const entry = this.#values.get(key);
    return entry?.version === version && this.#usable(entry.fetchedAt)
      ? (entry.value as T)
      : undefined;
  }
  #usable(time: number) {
    return time <= this.now() + 60_000 && this.now() - time < 86_400_000;
  }
  async read<T>(
    key: string,
    version: () => number,
    load: (options: ReadOptions, signal: AbortSignal) => Promise<T>,
    signal: AbortSignal,
    options: { force?: boolean; onProgress?: (value: T) => void } = {},
  ): Promise<T> {
    const epoch = version(),
      current = () => epoch === version() && !combined.aborted;
    const combined = AbortSignal.any([signal, this.#lifetime.signal]);
    combined.throwIfAborted();
    const previousEpoch = this.#epochs.get(key);
    if (previousEpoch !== undefined && previousEpoch !== epoch)
      this.#invalidated.add(key);
    this.#epochs.set(key, epoch);
    if (this.#epochs.size > 200)
      this.#epochs.delete(this.#epochs.keys().next().value!);
    let entry = this.#values.get(key);
    if (entry?.version !== epoch || !this.#usable(entry.fetchedAt))
      entry = undefined;
    if (!entry && !this.#invalidated.has(key)) {
      const stored = await this.cache?.get(key);
      combined.throwIfAborted();
      if (stored && this.#usable(stored.fetchedAt))
        entry = {
          value: stored.body,
          fetchedAt: stored.fetchedAt,
          version: epoch,
        };
    }
    if (!current())
      throw new MaintenanceReadError(
        "Resource changed while loading. Refresh it.",
      );
    if (entry) {
      this.#remember(key, entry);
      if (!options.force && this.now() - entry.fetchedAt < 300_000)
        return entry.value as T;
      options.onProgress?.(entry.value as T);
    }
    let observedAt = this.now();
    try {
      const value = await load(
        {
          force: options.force,
          priority: "interactive",
          onObservation: (time) => {
            observedAt = Math.min(observedAt, time);
          },
        },
        combined,
      );
      combined.throwIfAborted();
      if (!current())
        throw new MaintenanceReadError(
          "Resource changed while loading. Refresh it.",
        );
      this.#remember(key, { value, fetchedAt: observedAt, version: epoch });
      const writing = this.#writing
        .catch(() => {})
        .then(async () => {
          if (!current()) return;
          await this.cache?.put(key, { body: value, fetchedAt: observedAt });
          if (!current()) {
            await this.cache?.remove(key);
            return;
          }
          this.#invalidated.delete(key);
        });
      this.#writing = writing.catch(() => {});
      return value;
    } catch (error) {
      if (error instanceof MaintenanceReadError && error.discardPreview) {
        this.#values.delete(key);
        this.#invalidated.add(key);
        await this.#writing.catch(() => {});
        if (current()) await this.cache?.remove(key);
      }
      throw error;
    }
  }
  #remember(key: string, value: Retained) {
    this.#values.delete(key);
    this.#values.set(key, value);
    if (this.#values.size > 100)
      this.#values.delete(this.#values.keys().next().value!);
  }
  dispose() {
    this.#lifetime.abort();
    this.#values.clear();
  }
  async drain() {
    await this.#writing.catch(() => {});
  }
}
