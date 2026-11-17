import { attentionSnapshot, requiresAttention } from "../maintenance/attention";
import { compactCoordinatorEvidence } from "../maintenance/operation-decisions";
import type { CoordinatorEvidence } from "../maintenance/operator-types";
import type {
  MaintenanceDetail,
  MaintenanceSnapshot,
} from "../maintenance/types";
import type {
  CachedResponse,
  CacheTransform,
  ResponseCache,
} from "./response-cache";

/** Whole API responses are either retained or omitted: never change an ETag's body. */
export const ephemeralResponse = (key: string) =>
  /^activity:/.test(key) ||
  /:activity:/.test(key) ||
  /^json:\/repos\/[^/]+\/[^/]+\/(?:events\?|issues\/\d+\/(?:timeline|comments))/.test(
    key,
  ) ||
  /^json:\/repos\/[^/]+\/[^/]+\/(?:actions\/runs\?|graphql:)/.test(key);

export const retainResponse: CacheTransform = (key, value) => {
  if (ephemeralResponse(key)) return;
  const body = value.body as Record<string, unknown> | undefined;
  // Raw report bodies carry audit history and validators; never store a filtered HTTP body.
  if (
    key === "coordinator-evidence:v1" ||
    /^[^:]+:\/repos\/lapismd\/dependency-automation\/contents\/report\.json(?:\?|$)/.test(
      key,
    )
  )
    return;
  if (key === "coordinator-evidence:v2") {
    if (
      !body ||
      !["current", "stale", "unsupported", "unavailable"].includes(
        String(body.state),
      )
    )
      return;
    const evidence = body as unknown as CoordinatorEvidence;
    if (evidence.report && !Array.isArray(evidence.report.operations)) return;
    return {
      body: compactCoordinatorEvidence(evidence),
      fetchedAt: value.fetchedAt,
    };
  }
  if (key.startsWith("maintenance-view:") && body?.schema === 1) {
    const snapshot = body.snapshot as MaintenanceSnapshot | undefined;
    if (!Array.isArray(snapshot?.items)) return;
    const next = attentionSnapshot(snapshot);
    if (snapshot.coordinator)
      next.coordinator = compactCoordinatorEvidence(snapshot.coordinator);
    return next.items.length === snapshot.items.length && !snapshot.coordinator
      ? value
      : { ...value, body: { ...body, snapshot: next } };
  }
  if (key.startsWith("maintenance-detail:")) {
    const detail = body?.detail as MaintenanceDetail | undefined;
    if (!detail?.item || !requiresAttention(detail.item)) return;
  }
  if (
    /^review:/.test(key) &&
    ["closed", "merged"].includes(String(body?.state))
  )
    return;
  if (
    /^json:\/repos\/[^/]+\/[^/]+\/pulls\/\d+$/.test(key) &&
    body?.state === "closed"
  )
    return;
  if (
    /^json:\/repos\/[^/]+\/[^/]+\/actions\/runs\/\d+$/.test(key) &&
    body?.status === "completed" &&
    ["success", "skipped", "neutral", "cancelled"].includes(
      String(body.conclusion),
    )
  )
    return;
  return value;
};

/** Only complete repository evidence can retire identities, never a failed/partial read. */
export function attentionReconciliation(
  snapshot: MaintenanceSnapshot,
): CacheTransform {
  const coverage = new Map(snapshot.repositories.map((r) => [r.repository, r]));
  const verified = (repository: string, pull: boolean) => {
    const row = coverage.get(repository);
    return (
      !!row &&
      !row.loading &&
      (row.available ||
        (pull ? row.inventory?.pullRequests : row.inventory?.workflows))
    );
  };
  const items = snapshot.items.filter(requiresAttention);
  const ids = new Set(items.map((i) => i.id));
  const shas = new Map<string, Set<string>>();
  for (const item of items) {
    if (!shas.has(item.repository)) shas.set(item.repository, new Set());
    shas.get(item.repository)!.add(item.target.sha);
  }
  return (key, value) => {
    const body = value.body as Record<string, unknown> | undefined;
    if (key.startsWith("maintenance-view:") && body?.schema === 1) {
      const previous = body.snapshot as MaintenanceSnapshot;
      if (!Array.isArray(previous?.items)) return;
      const retained = previous.items.filter(
        (i) =>
          requiresAttention(i) &&
          (!verified(i.repository, i.kind === "pull-request") || ids.has(i.id)),
      );
      return retained.length === previous.items.length
        ? value
        : {
            ...value,
            body: { ...body, snapshot: { ...previous, items: retained } },
          };
    }
    const detail = key.startsWith("maintenance-detail:")
      ? (body?.detail as MaintenanceDetail | undefined)
      : undefined;
    if (
      detail?.item &&
      verified(detail.item.repository, detail.item.kind === "pull-request") &&
      !ids.has(detail.item.id)
    )
      return;
    const review =
      /^review:v\d+:([^:]+):((?:pr|run|deployment):[^:]+:\d+(?::\d+)?):/.exec(
        key,
      );
    if (
      review &&
      verified(review[1]!, review[2]!.startsWith("pr:")) &&
      !ids.has(review[2]!)
    )
      return;
    const raw = /^json:\/repos\/([^/]+\/[^/]+)\/(.+)$/.exec(key);
    if (!raw) return value;
    const repository = raw[1]!,
      path = raw[2]!;
    const pull = /^pulls\/(\d+)(?:\/|$)/.exec(path);
    if (
      pull &&
      verified(repository, true) &&
      !ids.has(`pr:${repository}:${pull[1]}`)
    )
      return;
    const run = /^actions\/runs\/(\d+)(?:\/|$)/.exec(path);
    if (
      run &&
      verified(repository, false) &&
      !items.some(
        (i) =>
          i.repository === repository &&
          (i.target.kind === "workflow" || i.target.kind === "deployment") &&
          i.target.runId === Number(run[1]),
      )
    )
      return;
    const commit = /^commits\/([a-f0-9]{40})\//.exec(path);
    if (
      commit &&
      verified(repository, true) &&
      verified(repository, false) &&
      !shas.get(repository)?.has(commit[1]!)
    )
      return;
    if (
      /^pulls\?/.test(path) &&
      verified(repository, true) &&
      Array.isArray(value.body) &&
      value.body.some(
        (p: { number: number }) => !ids.has(`pr:${repository}:${p.number}`),
      )
    )
      return;
    // Old query batches can mention PRs no longer present in an open inventory.
    if (path.startsWith("graphql:") && verified(repository, true)) return;
    return value;
  };
}
export async function reconcileAttention(
  cache: ResponseCache | undefined,
  snapshot: MaintenanceSnapshot,
) {
  if (!cache) return;
  if (!cache.retain) return cache.sweep(attentionReconciliation(snapshot));
  for (const row of snapshot.repositories) {
    for (const kind of ["pullRequests", "workflows"] as const) {
      if (row.loading || (!row.available && !row.inventory?.[kind])) continue;
      await cache.retain(
        `${row.repository}:${kind}`,
        attentionReconciliation({
          ...snapshot,
          repositories: [
            {
              ...row,
              available: false,
              inventory: {
                pullRequests: kind === "pullRequests",
                workflows: kind === "workflows",
              },
            },
          ],
          items: snapshot.items.filter(
            (item) => item.repository === row.repository,
          ),
        }),
      );
    }
    if (
      !row.loading &&
      (row.available ||
        (row.inventory?.pullRequests && row.inventory.workflows))
    ) {
      await cache.retain(
        `${row.repository}:revisions`,
        attentionReconciliation({
          ...snapshot,
          repositories: [row],
          items: snapshot.items.filter(
            (item) => item.repository === row.repository,
          ),
        }),
      );
    }
  }
  await cache.sweep(attentionReconciliation(snapshot));
}
