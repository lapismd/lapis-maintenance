import type { MaintenanceSnapshot } from "./types";
/** Preserve the full view's freshness: updating one repo does not validate its peers. */
export function patchRepository(
  base: MaintenanceSnapshot,
  patch: MaintenanceSnapshot,
  repository: string,
): MaintenanceSnapshot {
  return {
    items: [
      ...base.items.filter((item) => item.repository !== repository),
      ...patch.items,
    ],
    repositories: [
      ...base.repositories.filter((row) => row.repository !== repository),
      ...patch.repositories,
    ],
    fetchedAt: base.fetchedAt,
  };
}
