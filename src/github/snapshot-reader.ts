import type {
  MaintenanceDetail,
  MaintenanceSnapshot,
  RepositoryCoverage,
} from "../maintenance/types";
import type { RepositorySelection, RepositoryDefault } from "./models";
import {
  GithubError,
  type GithubTransport,
  type ReadOptions,
} from "./transport";
import { discoverRepositories } from "./repository-discovery";
import { readRepository } from "./repository-reads";
import { mergeCoverage } from "./coverage";
import { readCachedView, saveCachedView } from "../cache/view-cache";
import type { ResponseCache } from "../cache/response-cache";
import { RepositoryRefreshes } from "./repository-refresh";
/** Full inventory reads and scoped overlays share one revision-aware materialization. */
export class GithubSnapshots {
  details = new Map<string, MaintenanceDetail>();
  holds = new Map<string, string>();
  #generation = 0;
  #viewWrite: Promise<void> = Promise.resolve();
  readonly scopes: RepositoryRefreshes;
  constructor(
    private client: GithubTransport,
    private selection: () => RepositorySelection,
    private now = Date.now,
    private actor?: string,
    private cache?: ResponseCache,
    private onDefaults?: (defaults: RepositoryDefault[]) => void,
  ) {
    this.scopes = new RepositoryRefreshes(
      client,
      selection,
      now,
      actor,
      cache,
      () => this.details,
      () => this.holds,
      (work) => this.persist(work),
    );
  }
  persist(work: () => Promise<void>) {
    const pending = this.#viewWrite.then(work);
    this.#viewWrite = pending.catch(() => {});
    return pending;
  }
  async drain() {
    await this.#viewWrite;
  }
  async readSnapshot(
    signal: AbortSignal,
    options: ReadOptions = {},
  ): Promise<MaintenanceSnapshot> {
    const updates = this.scopes.begin();
    try {
      const generation = ++this.#generation;
      const selection = structuredClone(this.selection());
      let cached = await readCachedView(this.cache, selection, this.now());
      if (cached) cached = this.scopes.apply(cached, updates);
      signal.throwIfAborted();
      if (cached && generation === this.#generation) {
        this.details = new Map(
          cached.items.map((item) => [
            item.id,
            { item, description: "", checks: [] },
          ]),
        );
        this.scopes.remember(updates);
        this.holds = new Map(
          cached.repositories
            .filter((repo) => repo.holdReason)
            .map((repo) => [repo.repository, repo.holdReason!]),
        );
        const fresh =
          !options.force &&
          this.now() - Date.parse(cached.fetchedAt) < 300_000 &&
          !cached.repositories.some((repo) => repo.loading);
        options.onProgress?.(
          fresh
            ? cached
            : {
                ...cached,
                repositories: cached.repositories.map((repo) => ({
                  ...repo,
                  loading: true,
                })),
              },
        );
        if (fresh) {
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
          return this.scopes.apply(cached, updates);
        }
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
      const completed = new Map<string, MaintenanceDetail[]>();
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
      const publish = (checkpoint = false) => {
        signal.throwIfAborted();
        if (generation !== this.#generation) return;
        this.scopes.fold(updates, completed, pendingCoverage);
        const details = [...completed.values()].flat();
        for (const detail of details) this.details.set(detail.item.id, detail);
        const progress: MaintenanceSnapshot = {
          items: [
            ...details.map((detail) => detail.item),
            ...(cached?.items.filter(
              (item) => pendingCoverage.get(item.repository)?.loading,
            ) ?? []),
          ],
          repositories: mergeCoverage([
            ...coverage,
            ...pendingCoverage.values(),
          ]),
          fetchedAt: cached?.fetchedAt ?? new Date(validatedAt).toISOString(),
        };
        options.onProgress?.(progress);
        if (checkpoint)
          void this.persist(async () => {
            if (generation === this.#generation)
              await saveCachedView(
                this.cache,
                selection,
                this.scopes.apply(progress, updates),
              );
          }).catch(() => {});
      };
      this.holds = new Map(
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
            publish(true);
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
        const scoped = updates.get([...repositories.keys()][index]!);
        if (scoped) {
          details.push(...scoped.details);
          coverage.push(scoped.coverage);
          return;
        }
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
        this.details = new Map(
          details.map((detail) => [detail.item.id, detail]),
        );
        this.holds = new Map(
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
        await this.persist(async () => {
          signal.throwIfAborted();
          await saveCachedView(
            this.cache,
            selection,
            this.scopes.apply(snapshot, updates),
          );
        });
      }
      return this.scopes.apply(snapshot, updates);
    } finally {
      this.scopes.end(updates);
    }
  }
}
