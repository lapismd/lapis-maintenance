import type { MaintenanceSnapshot } from "../maintenance/types";
import type { RepositorySelection } from "../github/models";
import { validRepository } from "../github/models";
import type { ResponseCache } from "./response-cache";
/** Derived data only. Credentials and execution authority never enter this record. */
export const viewKey = (selection: RepositorySelection) =>
  `maintenance-view:v1:${JSON.stringify({
    additions: [...new Set(selection.additions)].sort(),
    exclusions: [...new Set(selection.exclusions)].sort(),
  })}`;
export async function readCachedView(
  cache: ResponseCache | undefined,
  selection: RepositorySelection,
  now: number,
): Promise<MaintenanceSnapshot | undefined> {
  const value = await cache?.get(viewKey(selection));
  if (!value) return;
  const body = value.body as
    | { schema?: number; snapshot?: MaintenanceSnapshot }
    | undefined;
  const snapshot = body?.snapshot;
  if (
    body?.schema !== 1 ||
    !snapshot ||
    !Array.isArray(snapshot.items) ||
    !Array.isArray(snapshot.repositories) ||
    snapshot.items.length > 5000 ||
    !Number.isFinite(Date.parse(snapshot.fetchedAt)) ||
    now - Date.parse(snapshot.fetchedAt) > 86_400_000 ||
    Date.parse(snapshot.fetchedAt) > now + 60_000 ||
    snapshot.items.some(
      (item) =>
        !item ||
        typeof item.id !== "string" ||
        !validRepository(item.repository) ||
        !item.target ||
        typeof item.target.sha !== "string" ||
        !Array.isArray(item.actions),
    ) ||
    snapshot.repositories.some(
      (repo) => !repo || !validRepository(repo.repository) || repo.loading,
    )
  )
    return;
  return snapshot;
}
export async function saveCachedView(
  cache: ResponseCache | undefined,
  selection: RepositorySelection,
  snapshot: MaintenanceSnapshot,
) {
  await cache?.put(viewKey(selection), {
    body: { schema: 1, snapshot },
    fetchedAt: Date.parse(snapshot.fetchedAt),
  });
}
