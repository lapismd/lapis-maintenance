import type { RepositoryChecksSnapshot } from "@lapismd/repository-ui/jj";
import type { MaintenanceDetail } from "./types";
/** One host mapping for every checks consumer, including the embedded PR panel. */
export function checkSnapshot(
  detail: MaintenanceDetail,
): RepositoryChecksSnapshot {
  return {
    sha: detail.item.target.sha,
    complete:
      !detail.coverage?.length &&
      !detail.checks.some((check) => check.state === "unknown"),
    items: detail.checks.map((check, index) => ({
      id: `${index}:${check.name}`,
      ...check,
    })),
  };
}
