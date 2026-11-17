import { expect, it } from "vitest";
import {
  repositoryDecisions,
  compactCoordinatorEvidence,
} from "./operation-decisions";
import { operatorFixture } from "../../catalog/operations/fixtures";
const base = operatorFixture().coordinator!.report!.operations[0]!;
const operation = (
  id: string,
  observedAt: string,
  repository = "example/consumer",
) => ({ ...base, id, repository, observedAt });

it("chooses the latest observation, not array position or lexical timezone order, keeping one predecessor", () => {
  const current = operation("current", "2026-11-15T20:00:00Z"),
    previous = operation("previous", "2026-11-15T20:30:00+01:00"),
    old = operation("old", "2026-11-15T18:00:00Z");
  for (const operations of [
    [current, old, previous],
    [previous, current, old],
    [old, previous, current],
  ]) {
    expect(repositoryDecisions(operations)).toEqual([{ current, previous }]);
  }
});
it("groups case-equivalent repository names and ignores duplicate decision IDs with deterministic timestamp ties", () => {
  const old = operation("old", "2026-11-15T18:00:00Z"),
    first = operation("first", "2026-11-15T20:00:00Z"),
    current = operation("current", "2026-11-15T20:00:00Z", "Example/Consumer"),
    other = operation("other", "2026-11-15T19:00:00Z", "example/other");
  expect(repositoryDecisions([old, first, current, current, other])).toEqual([
    { current, previous: first },
    { current: other, previous: undefined },
  ]);
});
it("bounds large history to two decisions per repository while preserving current evidence and audit identities", () => {
  const evidence = operatorFixture().coordinator!;
  const report = evidence.report!;
  report.operations = Array.from({ length: 1000 }, (_, i) =>
    operation(
      String(i),
      new Date(Date.UTC(2026, 10, 15, 0, i)).toISOString(),
      `example/repo-${i % 20}`,
    ),
  );
  const source = JSON.stringify(evidence);
  const compact = compactCoordinatorEvidence(evidence);
  expect(compact.report!.operations).toHaveLength(40);
  expect(repositoryDecisions(compact.report!.operations)).toHaveLength(20);
  expect(compact.operationHistory).toBe("latest-and-previous");
  expect(compact.report!.reportId).toBe(report.reportId);
  expect(compact.report!.nodes).toEqual(report.nodes);
  expect(JSON.stringify(evidence)).toBe(source);
  expect(compactCoordinatorEvidence(compact)).toEqual(compact);
});
it("handles empty and single-decision reports without inventing comparison history", () => {
  expect(repositoryDecisions([])).toEqual([]);
  expect(repositoryDecisions([base])).toEqual([
    { current: base, previous: undefined },
  ]);
  expect(
    compactCoordinatorEvidence({ state: "unavailable", reason: "No report" }),
  ).toEqual({ state: "unavailable", reason: "No report" });
});
