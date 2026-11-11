import type {
  MaintenanceDetail,
  MaintenanceSnapshot,
  RepositoryCoverage,
} from "../maintenance/types";
import { patchRepository } from "../maintenance/repository-snapshot";
import type { GithubTransport } from "./transport";
import type { RepositorySelection } from "./models";
import { readRepository } from "./repository-reads";
import type { ResponseCache } from "../cache/response-cache";
import { readCachedView, saveCachedView } from "../cache/view-cache";
type RepositoryResult = Awaited<ReturnType<typeof readRepository>>;
/** Newer scoped results overlay any older, still-running global scan. */
export class RepositoryRefreshes {
  #active = new Set<Map<string, RepositoryResult>>();
  #versions = new Map<string, number>();
  constructor(
    private client: GithubTransport,
    private selection: () => RepositorySelection,
    private now: () => number,
    private actor: string | undefined,
    private cache: ResponseCache | undefined,
    private details: () => Map<string, MaintenanceDetail>,
    private holds: () => Map<string, string>,
    private persist: (work: () => Promise<void>) => Promise<void>,
  ) {}
  version(repository: string) {
    return this.#versions.get(repository) ?? 0;
  }
  begin() {
    const updates = new Map<string, RepositoryResult>();
    this.#active.add(updates);
    return updates;
  }
  end(updates: Map<string, RepositoryResult>) {
    this.#active.delete(updates);
  }
  snapshot(repository: string, result: RepositoryResult): MaintenanceSnapshot {
    return {
      items: result.details.map((detail) => detail.item),
      repositories: [result.coverage],
      fetchedAt: new Date(this.now()).toISOString(),
    };
  }
  apply(snapshot: MaintenanceSnapshot, updates: Map<string, RepositoryResult>) {
    for (const [repository, result] of updates)
      snapshot = patchRepository(
        snapshot,
        this.snapshot(repository, result),
        repository,
      );
    return snapshot;
  }
  remember(updates: Map<string, RepositoryResult>) {
    for (const result of updates.values())
      for (const detail of result.details)
        this.details().set(detail.item.id, detail);
  }
  fold(
    updates: Map<string, RepositoryResult>,
    completed: Map<string, MaintenanceDetail[]>,
    coverage: Map<string, RepositoryCoverage>,
  ) {
    for (const [repository, result] of updates) {
      completed.set(repository, result.details);
      coverage.set(repository, result.coverage);
    }
  }
  async refresh(
    repository: string,
    signal: AbortSignal,
  ): Promise<MaintenanceSnapshot> {
    const selection = structuredClone(this.selection());
    this.#versions.set(repository, this.version(repository) + 1);
    this.client.invalidateRepository(repository);
    // Entity/job responses may predate the command; keep inventory validators for conditional reads.
    await Promise.all([
      this.cache?.removePrefix(`json:/repos/${repository}/pulls/`),
      this.cache?.removePrefix(`json:/repos/${repository}/actions/runs/`),
      this.cache?.removePrefix(`maintenance-detail:v2:${repository}:`),
    ]);
    signal.throwIfAborted();
    const result = await readRepository(
      this.client,
      { repository, holdReason: this.holds().get(repository) },
      signal,
      { force: true, priority: "interactive" },
      this.now,
      this.actor,
    );
    signal.throwIfAborted();
    await this.cache?.removePrefix(`maintenance-detail:v2:${repository}:`);
    signal.throwIfAborted();
    this.#versions.set(repository, this.version(repository) + 1);
    for (const updates of this.#active) updates.set(repository, result);
    for (const [id, detail] of this.details())
      if (detail.item.repository === repository) this.details().delete(id);
    for (const detail of result.details)
      this.details().set(detail.item.id, detail);
    const snapshot = this.snapshot(repository, result);
    await this.persist(async () => {
      signal.throwIfAborted();
      const base = await readCachedView(this.cache, selection, this.now());
      signal.throwIfAborted();
      if (base)
        await saveCachedView(
          this.cache,
          selection,
          patchRepository(base, snapshot, repository),
        );
    });
    return snapshot;
  }
}
