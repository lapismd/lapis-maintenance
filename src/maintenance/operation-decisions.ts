import { scopedEvidence } from "./scoped-admission";
import type { CoordinatorEvidence, WaveReport } from "./operator-types";
export type OperationDecision = WaveReport["operations"][number];
export interface RepositoryDecision {
  current: OperationDecision;
  previous?: OperationDecision;
}
const observed = (operation: OperationDecision) => {
  const time = Date.parse(operation.observedAt);
  return Number.isFinite(time) ? time : -Infinity;
};
/** Select before filtering; array order is not a claim about when an observation occurred. */
export function repositoryDecisions(
  operations: readonly OperationDecision[],
): RepositoryDecision[] {
  const repositories = new Map<string, OperationDecision[]>();
  for (const operation of operations) {
    const repository = operation.repository.toLowerCase();
    const retained = [operation, ...(repositories.get(repository) ?? [])]
      .sort((a, b) => observed(b) - observed(a))
      .filter(
        (candidate, index, rows) =>
          rows.findIndex((row) => row.id === candidate.id) === index,
      )
      .slice(0, 2);
    repositories.set(repository, retained);
  }
  return [...repositories.values()].map(([current, previous]) => ({
    current: current!,
    previous,
  }));
}
/** A host-owned presentation projection, not a replacement for the immutable source report. */
export function compactCoordinatorEvidence(
  evidence: CoordinatorEvidence,
  now = Date.now(),
): CoordinatorEvidence {
  evidence = scopedEvidence(evidence, now);
  if (!evidence.report) return evidence;
  return {
    ...evidence,
    operationHistory: "latest-and-previous",
    report: {
      ...evidence.report,
      operations: repositoryDecisions(evidence.report.operations).flatMap(
        ({ current, previous }) => (previous ? [previous, current] : [current]),
      ),
    },
  };
}
