import type { RepositoryCoverage } from "../maintenance/types";
/** Discovery and activity failures describe one repository, never duplicate rows. */
export function mergeCoverage(
  entries: RepositoryCoverage[],
): RepositoryCoverage[] {
  const byRepository = new Map<string, RepositoryCoverage>();
  for (const entry of entries) {
    const previous = byRepository.get(entry.repository);
    byRepository.set(
      entry.repository,
      previous
        ? {
            ...entry,
            available: previous.available && entry.available,
            loading: !!previous.loading && !!entry.loading,
            reason:
              [
                ...new Set([previous.reason, entry.reason].filter(Boolean)),
              ].join(" ") || undefined,
            holdReason: entry.holdReason ?? previous.holdReason,
          }
        : entry,
    );
  }
  return [...byRepository.values()];
}
