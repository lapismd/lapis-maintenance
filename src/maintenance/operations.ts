import { scopedEvidence } from "./scoped-admission";
import type { CoordinatorEvidence, WaveNode } from "./operator-types";
import type { MaintenanceSnapshot } from "./types";
import {
  filterRepositories,
  type RepositoryActionState,
} from "./repository-actions";
export function operationNeedsAttention(node: WaveNode) {
  return (
    [
      "failed",
      "held",
      "uncertain",
      "approval-wait",
      "action-required",
    ].includes(node.status) ||
    node.ownership.state === "repair-owned" ||
    node.updates.some((update) => update.compatibility === "breaking") ||
    node.holds.length > 0 ||
    !!(
      node.scopedAdmission &&
      (node.scopedAdmission.deferredUpdates.length ||
        node.scopedAdmission.deferredHolds.length ||
        node.scopedAdmission.deferredWaits.length)
    ) ||
    !!node.branchHolds?.length ||
    /approval|action.required/i.test(node.acceptance.reason)
  );
}
export function operationsScope(
  snapshot: MaintenanceSnapshot | null,
  evidence: CoordinatorEvidence | null | undefined,
  repositories: string[],
  states: RepositoryActionState[],
  query: string,
) {
  const allowed = new Set(
    filterRepositories(snapshot?.repositories ?? [], states).map(
      (row) => row.repository,
    ),
  );
  const matches = (repository: string, text = "") =>
    (!states.length || allowed.has(repository)) &&
    (!repositories.length || repositories.includes(repository)) &&
    (!query ||
      `${repository} ${text}`.toLowerCase().includes(query.toLowerCase()));
  const nodes =
    (evidence ? scopedEvidence(evidence).report : undefined)?.nodes.filter(
      (n) =>
        matches(
          n.repository,
          `${n.status} ${n.acceptance.reason} ${n.ownership.reason} ${n.holds.join(" ")} ${n.scopedAdmission ? JSON.stringify(n.scopedAdmission) : ""}`,
        ),
    ) ?? [];
  const issues =
    snapshot?.issues?.filter((i) => matches(i.repository, i.title)) ?? [];
  return {
    matches,
    nodes,
    issues,
    attention: nodes.filter(operationNeedsAttention),
  };
}
export function operationTone(status: string) {
  if (/failed|failure|uncertain/.test(status)) return "failure";
  if (/held|approval|repair|breaking/.test(status)) return "attention";
  if (/passed|published|completed|success|unchanged|^current$/.test(status))
    return "success";
  return "neutral";
}
