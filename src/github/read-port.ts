import {
  targetKey,
  type MaintenanceReadPort,
  type MaintenanceSnapshot,
  type MaintenanceDetail,
} from "../maintenance/types";
import type { RepositorySelection, RepositoryDefault } from "./models";
import {
  GithubError,
  type GithubTransport,
  type ReadOptions,
} from "./transport";
import { readItemDetails } from "./item-details";
import type { ResponseCache } from "../cache/response-cache";
import { readCachedDetail, saveCachedDetail } from "../cache/detail-cache";
import { viewKey } from "../cache/view-cache";
import { GithubSnapshots } from "./snapshot-reader";

export class GithubReadPort implements MaintenanceReadPort {
  #snapshots: GithubSnapshots;
  #writes = new Set<Promise<void>>();
  #previews = new Map<
    string,
    {
      detail: MaintenanceDetail;
      fetchedAt: number;
      selection: string;
      version: number;
    }
  >();
  constructor(
    private client: GithubTransport,
    private selection: () => RepositorySelection,
    private now = Date.now,
    private actor?: string,
    private cache?: ResponseCache,
    onDefaults?: (defaults: RepositoryDefault[]) => void,
  ) {
    this.#snapshots = new GithubSnapshots(
      client,
      selection,
      now,
      actor,
      cache,
      onDefaults,
    );
  }
  readSnapshot(
    signal: AbortSignal,
    options: ReadOptions = {},
  ): Promise<MaintenanceSnapshot> {
    return this.#snapshots.readSnapshot(signal, options);
  }
  refreshRepository(repository: string, signal: AbortSignal) {
    return this.#snapshots.scopes.refresh(repository, signal);
  }
  async drain() {
    await Promise.allSettled([...this.#writes]);
    await this.#snapshots.drain();
  }
  async readDetails(
    id: string,
    signal: AbortSignal,
    options: {
      fresh?: boolean;
      onProgress?: (detail: MaintenanceDetail) => void;
    } = {},
  ): Promise<MaintenanceDetail> {
    const existing = this.#snapshots.details.get(id);
    const repository = existing?.item.repository ?? "";
    const version = this.#snapshots.scopes.version(repository);
    const selection = structuredClone(this.selection());
    const preview = this.#previews.get(id);
    signal.throwIfAborted();
    if (!options.fresh && existing) {
      if (preview) {
        if (
          preview.selection === viewKey(selection) &&
          preview.version === version &&
          this.now() - preview.fetchedAt < 86_400_000 &&
          preview.fetchedAt <= this.now() + 60_000 &&
          targetKey(preview.detail.item.target) ===
            targetKey(existing.item.target)
        )
          options.onProgress?.(preview.detail);
      } else if (existing.description || existing.checks.length)
        options.onProgress?.(existing);
    }
    const cached =
      !options.fresh && existing
        ? await readCachedDetail(
            this.cache,
            selection,
            id,
            existing.item.target,
            this.now(),
          )
        : undefined;
    signal.throwIfAborted();
    if (version !== this.#snapshots.scopes.version(repository))
      return this.readDetails(id, signal, options);
    if (cached) {
      this.#remember(cached.detail, cached.fetchedAt, selection, version);
      if (this.now() - cached.fetchedAt < 300_000) return cached.detail;
      options.onProgress?.(cached.detail);
    }
    let fetchedAt = this.now();
    try {
      const detail = await readItemDetails(
        this.client,
        existing,
        signal,
        this.#snapshots.holds.get(repository),
        this.actor,
        {
          fresh: options.fresh,
          priority: "interactive",
          onObservation: (time) => {
            fetchedAt = Math.min(fetchedAt, time);
          },
        },
      );
      signal.throwIfAborted();
      if (version !== this.#snapshots.scopes.version(repository))
        return this.readDetails(id, signal, options);
      this.#remember(detail, fetchedAt, selection, version);
      const writing = saveCachedDetail(
        this.cache,
        selection,
        detail,
        fetchedAt,
      );
      this.#writes.add(writing);
      try {
        await writing;
      } finally {
        this.#writes.delete(writing);
      }
      if (version !== this.#snapshots.scopes.version(repository)) {
        await this.cache?.removePrefix(`maintenance-detail:v2:${repository}:`);
        return this.readDetails(id, signal, options);
      }
      return detail;
    } catch (error) {
      if (error instanceof GithubError && error.discardPreview) {
        for (const [key, value] of this.#previews)
          if (value.detail.item.repository === repository)
            this.#previews.delete(key);
        for (const [key, value] of this.#snapshots.details)
          if (value.item.repository === repository)
            this.#snapshots.details.set(key, {
              item: value.item,
              description: "",
              checks: [],
            });
        await this.cache?.removePrefix(`maintenance-detail:v2:${repository}:`);
      }
      throw error;
    }
  }
  #remember(
    detail: MaintenanceDetail,
    fetchedAt: number,
    selection: RepositorySelection,
    version: number,
  ) {
    this.#previews.delete(detail.item.id);
    this.#previews.set(detail.item.id, {
      detail,
      fetchedAt,
      selection: viewKey(selection),
      version,
    });
    if (this.#previews.size > 100)
      this.#previews.delete(this.#previews.keys().next().value!);
    this.#snapshots.details.set(detail.item.id, {
      item: detail.item,
      description: "",
      checks: [],
    });
    for (const item of detail.workflowApprovals ?? [])
      this.#snapshots.details.set(item.id, {
        item,
        description: "",
        checks: [],
      });
  }
}
