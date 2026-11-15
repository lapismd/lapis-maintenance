import type { ItemStatus, MaintenanceSnapshot, View } from "./types";
import {
  filterRepositories,
  type RepositoryActionState,
} from "./repository-actions";
const priority: Record<ItemStatus, number> = {
  "approval-wait": 0,
  failed: 1,
  unavailable: 1.5,
  "review-needed": 2,
  blocked: 3,
  draft: 4,
  cancelled: 5,
  running: 6,
  passed: 7,
};
interface Filters {
  query: string;
  view: View;
  repositories: string[];
  statuses: ItemStatus[];
  repositoryStatuses: RepositoryActionState[];
}
export function visibleItems(
  snapshot: MaintenanceSnapshot | null,
  filters: Filters,
) {
  const query = filters.query.toLowerCase().trim();
  const repositories = new Set(
    filterRepositories(
      snapshot?.repositories ?? [],
      filters.repositoryStatuses,
    ).map((row) => row.repository),
  );
  return (snapshot?.items ?? [])
    .filter(
      (item) =>
        (["operations", "inbox", "activity"].includes(filters.view) ||
          item.kind === filters.view) &&
        (!filters.repositories.length ||
          filters.repositories.includes(item.repository)) &&
        (!filters.repositoryStatuses.length ||
          repositories.has(item.repository)) &&
        (!filters.statuses.length || filters.statuses.includes(item.status)) &&
        (!query ||
          [item.title, item.repository, item.category, ...item.reasons]
            .join(" ")
            .toLowerCase()
            .includes(query)),
    )
    .toSorted(
      (a, b) =>
        priority[a.status] - priority[b.status] || a.id.localeCompare(b.id),
    );
}
