import type { WaveNode, WaveReport } from "./operator-types";
import {
  repositoryActionLabels,
  repositoryActionState,
  type RepositoryActionState,
} from "./repository-actions";
import {
  statusLabels,
  type MaintenanceItem,
  type MaintenanceSnapshot,
} from "./types";

export interface CurrentRepositoryOperation {
  actions: {
    state: RepositoryActionState;
    label: string;
    reason: string;
    sha?: string;
  };
  pullRequests: { known: boolean; count: number; label: string };
  source: {
    state: "aligned" | "different" | "unknown";
    label: string;
  };
  currentItem?: MaintenanceItem;
}

export interface CurrentReleaseIntent {
  status: string;
  summary: string;
  publishedVersion?: string;
}

const itemPriority: Record<MaintenanceItem["status"], number> = {
  "approval-wait": 0,
  failed: 1,
  unavailable: 2,
  "review-needed": 3,
  blocked: 4,
  draft: 5,
  running: 6,
  cancelled: 7,
  passed: 8,
};

export function currentRepositoryOperation(
  snapshot: MaintenanceSnapshot | null,
  node: WaveNode,
): CurrentRepositoryOperation {
  const repository = snapshot?.repositories.find(
    (row) => row.repository.toLowerCase() === node.repository.toLowerCase(),
  );
  const repositoryAvailable = repository?.available === true;
  const workflowCoverage =
    repositoryAvailable && repository?.inventory?.workflows === true;
  const actionState = workflowCoverage
    ? repositoryActionState(repository!)
    : "unknown";
  const repositoryItems = (snapshot?.items ?? []).filter(
    (item) => item.repository.toLowerCase() === node.repository.toLowerCase(),
  );
  const pullCoverage =
    repositoryAvailable && repository?.inventory?.pullRequests === true;
  const pullRequests = pullCoverage
    ? repositoryItems.filter((item) => item.kind === "pull-request")
    : [];
  const items = repositoryItems
    .filter(
      (item) =>
        (item.kind === "pull-request" ? pullCoverage : workflowCoverage) &&
        (item.kind === "pull-request" ||
          !["passed", "cancelled"].includes(item.status)),
    )
    .toSorted(
      (a, b) =>
        itemPriority[a.status] - itemPriority[b.status] ||
        a.id.localeCompare(b.id),
    );
  const liveSha = repositoryAvailable ? repository?.actions?.sha : undefined;
  const source = !liveSha
    ? {
        state: "unknown" as const,
        label: "Current main revision is unavailable.",
      }
    : liveSha === node.sourceSha
      ? {
          state: "aligned" as const,
          label:
            "Observed coordinator source matches the refreshed default branch.",
        }
      : {
          state: "different" as const,
          label:
            "Observed coordinator source differs from the refreshed default branch.",
        };

  return {
    actions: {
      state: actionState,
      label: repositoryActionLabels[actionState],
      reason:
        (workflowCoverage ? repository?.actions?.reason : undefined) ??
        "Current default-branch workflow coverage is unavailable.",
      sha: liveSha,
    },
    pullRequests: {
      known: pullCoverage,
      count: pullRequests.length,
      label: pullCoverage
        ? pullRequests.length
          ? `${pullRequests.length} open pull request${pullRequests.length === 1 ? "" : "s"} observed.`
          : "No open pull request observed."
        : "Pull-request state is unavailable.",
    },
    source,
    currentItem: items[0]
      ? {
          ...items[0],
          reasons: [statusLabels[items[0].status], ...items[0].reasons],
        }
      : undefined,
  };
}

export function currentReleaseIntent(
  report: WaveReport,
  release: WaveReport["releases"][number],
): CurrentReleaseIntent {
  const publications = report.publications.filter(
    (item) => item.name === release.name,
  );
  const publication = release.version
    ? publications.find((item) => item.version === release.version)
    : undefined;
  if (release.status === "waiting" && publication)
    return {
      status: "admission-wait",
      publishedVersion: publication.version,
      summary: `${release.repository} · published ${publication.version}; coordinator admission or qualification remains`,
    };
  if (release.status === "waiting" && publications.length)
    return {
      status: "release-wait",
      summary: `${release.repository} · verified publication inventory exists; coordinator release intent remains waiting`,
    };
  if (release.status === "waiting")
    return {
      status: "publication-wait",
      summary: `${release.repository} · ${release.version ?? release.baseline}; publication is not yet verified`,
    };
  return {
    status: release.status,
    publishedVersion: publication?.version,
    summary: `${release.repository} · ${release.version ?? release.baseline}`,
  };
}
