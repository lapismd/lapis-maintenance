import type {
  MaintenanceDetail,
  MaintenanceItem,
  MaintenanceSnapshot,
  RepositoryCoverage,
} from "./types";
export const summaryDetails = (items: MaintenanceItem[]) =>
  new Map<string, MaintenanceDetail>(
    items.map((item) => [item.id, { item, description: "", checks: [] }]),
  );
/** A passing open PR still needs merging; successful/cancelled jobs are resolved. */
export const requiresAttention = (item: MaintenanceItem) =>
  !!item &&
  (item.kind === "pull-request" ||
    !["passed", "cancelled"].includes(item.status));
export const unverifiedItem = (
  item: MaintenanceItem,
  coverage?: RepositoryCoverage,
) =>
  !!coverage &&
  !coverage.available &&
  !(item.kind === "pull-request"
    ? coverage.inventory?.pullRequests
    : coverage.inventory?.workflows);
export const attentionSnapshot = (
  snapshot: MaintenanceSnapshot,
): MaintenanceSnapshot => ({
  ...snapshot,
  items: snapshot.items.filter(requiresAttention),
});
/** Missing rows in partial coverage are unknown, rather than confirmed resolved. */
export function preserveUnverified(
  snapshot: MaintenanceSnapshot,
  previous?: MaintenanceSnapshot,
) {
  const coverage = new Map(snapshot.repositories.map((r) => [r.repository, r]));
  const observed = new Set(snapshot.items.map((i) => i.id));
  return {
    ...snapshot,
    items: [
      ...snapshot.items,
      ...(previous?.items ?? []).filter(
        (i) =>
          unverifiedItem(i, coverage.get(i.repository)) &&
          !observed.has(i.id) &&
          requiresAttention(i),
      ),
    ],
  };
}
