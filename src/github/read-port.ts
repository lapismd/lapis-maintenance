import {
  type MaintenanceReadPort,
  type MaintenanceSnapshot,
  type MaintenanceDetail,
  type RepositoryCoverage,
} from "../maintenance/types";
import { type RepositorySelection, type RepositoryDefault } from "./models";
import {
  GithubError,
  type GithubTransport,
  type ReadOptions,
} from "./transport";
import { readItemDetails } from "./item-details";
import { discoverRepositories } from "./repository-discovery";
import { readRepository } from "./repository-reads";
import { mergeCoverage } from "./coverage";
import { readCachedView, saveCachedView } from "../cache/view-cache";
import type { ResponseCache } from "../cache/response-cache";
import { readCachedDetail, saveCachedDetail } from "../cache/detail-cache";
export class GithubReadPort implements MaintenanceReadPort {
  #details = new Map<string, MaintenanceDetail>();
  #holds = new Map<string, string>();
  #generation = 0;
  #writes = new Set<Promise<void>>();
  constructor(
    private client: GithubTransport,
    private selection: () => RepositorySelection,
    private now = Date.now,
    private actor?: string,
    private cache?: ResponseCache,
    private onDefaults?: (defaults: RepositoryDefault[]) => void,
  ) {}
  async readSnapshot(
    signal: AbortSignal,
    options: ReadOptions = {},
  ): Promise<MaintenanceSnapshot> {
    const generation = ++this.#generation;
    const selection = structuredClone(this.selection());
    const cached = await readCachedView(this.cache, selection, this.now());
    signal.throwIfAborted();
    if (cached && generation === this.#generation) {
      this.#details = new Map(
        cached.items.map((item) => [
          item.id,
          { item, description: "", checks: [] },
        ]),
      );
      this.#holds = new Map(
        cached.repositories
          .filter((repo) => repo.holdReason)
          .map((repo) => [repo.repository, repo.holdReason!]),
      );
      if (
        !options.force &&
        this.now() - Date.parse(cached.fetchedAt) < 300_000
      ) {
        if (this.onDefaults) {
          const discovered = await discoverRepositories(
            this.client,
            selection,
            signal,
            options,
          );
          signal.throwIfAborted();
          if (generation === this.#generation)
            this.onDefaults(discovered.defaults);
        }
        return cached;
      }
      options.onProgress?.(cached);
    }
    let validatedAt = this.now();
    options = {
      ...options,
      onObservation: (time) => {
        validatedAt = Math.min(validatedAt, time);
      },
    };
    const { repositories, coverage, defaults } = await discoverRepositories(
      this.client,
      selection,
      signal,
      options,
    );
    if (generation === this.#generation && !signal.aborted)
      this.onDefaults?.(defaults);
    const completed = new Map<
      string,
      Awaited<ReturnType<GithubReadPort["readDetails"]>>[]
    >();
    const pendingCoverage = new Map<string, RepositoryCoverage>(
      [...repositories.values()].map((entry) => [
        entry.repository,
        {
          repository: entry.repository,
          available: false,
          loading: true,
          reason: "Loading repository activity…",
          holdReason: entry.holdReason,
        },
      ]),
    );
    const publish = () => {
      signal.throwIfAborted();
      if (generation !== this.#generation) return;
      const details = [...completed.values()].flat();
      for (const detail of details) this.#details.set(detail.item.id, detail);
      options.onProgress?.({
        items: [
          ...details.map((detail) => detail.item),
          ...(cached?.items.filter(
            (item) => pendingCoverage.get(item.repository)?.loading,
          ) ?? []),
        ],
        repositories: mergeCoverage([...coverage, ...pendingCoverage.values()]),
        fetchedAt: new Date(validatedAt).toISOString(),
      });
    };
    this.#holds = new Map(
      [...repositories.values()]
        .filter((entry) => entry.holdReason)
        .map((entry) => [entry.repository, entry.holdReason!]),
    );
    publish();
    const results = await Promise.allSettled(
      [...repositories.values()].map(async (entry) => {
        try {
          const result = await readRepository(
            this.client,
            entry,
            signal,
            options,
            this.now,
            this.actor,
          );
          completed.set(entry.repository, result.details);
          pendingCoverage.set(entry.repository, result.coverage);
          publish();
          return result;
        } catch (error) {
          pendingCoverage.set(entry.repository, {
            repository: entry.repository,
            available: false,
            reason:
              error instanceof Error
                ? error.message
                : "Repository unavailable.",
          });
          publish();
          throw error;
        }
      }),
    );
    signal.throwIfAborted();
    const details: MaintenanceDetail[] = [];
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        details.push(...result.value.details);
        coverage.push(result.value.coverage);
      } else {
        if (
          result.reason instanceof GithubError &&
          result.reason.status === 401
        )
          throw result.reason;
        coverage.push({
          repository: [...repositories.keys()][index]!,
          available: false,
          reason:
            result.reason instanceof Error
              ? result.reason.message
              : "Repository unavailable.",
        });
      }
    });
    if (generation === this.#generation) {
      this.#details = new Map(
        details.map((detail) => [detail.item.id, detail]),
      );
      this.#holds = new Map(
        [...repositories.values()]
          .filter((entry) => entry.holdReason)
          .map((entry) => [entry.repository, entry.holdReason!]),
      );
    }
    if (
      !details.length &&
      coverage.length &&
      coverage.every((entry) => !entry.available)
    ) {
      const rate = results.find(
        (result) =>
          result.status === "rejected" &&
          result.reason instanceof GithubError &&
          result.reason.retryAt,
      );
      if (rate?.status === "rejected") throw rate.reason;
    }
    const snapshot: MaintenanceSnapshot = {
      items: details.map((detail) => detail.item),
      repositories: mergeCoverage(coverage),
      fetchedAt: new Date(validatedAt).toISOString(),
    };
    if (generation === this.#generation) {
      signal.throwIfAborted();
      const writing = saveCachedView(this.cache, selection, snapshot);
      this.#writes.add(writing);
      try {
        await writing;
      } finally {
        this.#writes.delete(writing);
      }
    }
    return snapshot;
  }
  async drain() {
    await Promise.allSettled([...this.#writes]);
  }
  async readDetails(
    id: string,
    signal: AbortSignal,
    options: { fresh?: boolean } = {},
  ): Promise<MaintenanceDetail> {
    const existing = this.#details.get(id);
    signal.throwIfAborted();
    const selection = structuredClone(this.selection());
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
    if (cached) {
      this.#remember(cached);
      return cached;
    }
    let fetchedAt = this.now();
    const detail = await readItemDetails(
      this.client,
      existing,
      signal,
      existing ? this.#holds.get(existing.item.repository) : undefined,
      this.actor,
      {
        ...options,
        onObservation: (time) => {
          fetchedAt = Math.min(fetchedAt, time);
        },
      },
    );
    signal.throwIfAborted();
    this.#remember(detail);
    const writing = saveCachedDetail(this.cache, selection, detail, fetchedAt);
    this.#writes.add(writing);
    try {
      await writing;
    } finally {
      this.#writes.delete(writing);
    }
    return detail;
  }
  #remember(detail: MaintenanceDetail) {
    this.#details.set(detail.item.id, detail);
    for (const item of detail.workflowApprovals ?? [])
      this.#details.set(item.id, { item, description: "", checks: [] });
  }
}
