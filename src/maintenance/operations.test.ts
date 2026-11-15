import { expect, it } from "vitest";
import { operatorFixture } from "../../catalog/operations/fixtures";
import { operationNeedsAttention, operationsScope } from "./operations";
it("counts actionable operations and issues without treating routine waits as attention", () => {
  const snapshot = operatorFixture();
  expect(
    snapshot.coordinator!.report!.nodes.map(operationNeedsAttention),
  ).toEqual([false, true, true, true]);
  const scope = operationsScope(snapshot, snapshot.coordinator, [], [], "");
  expect(scope.attention).toHaveLength(3);
  expect(scope.attention.length + scope.issues.length).toBe(4);
});
it("intersects repository, branch state and search filters without widening empty matches", () => {
  const snapshot = operatorFixture();
  snapshot.repositories = [
    {
      repository: "example/repair",
      available: true,
      actions: {
        state: "failed",
        branch: "main",
        workflows: 1,
        reason: "Failed",
      },
    },
    {
      repository: "example/compatibility",
      available: true,
      actions: {
        state: "passed",
        branch: "main",
        workflows: 1,
        reason: "Passed",
      },
    },
  ];
  expect(
    operationsScope(
      snapshot,
      snapshot.coordinator,
      [],
      ["failed"],
      "",
    ).attention.map((n) => n.repository),
  ).toEqual(["example/repair"]);
  expect(
    operationsScope(
      snapshot,
      snapshot.coordinator,
      ["example/compatibility"],
      ["failed"],
      "",
    ).nodes,
  ).toEqual([]);
  expect(
    operationsScope(
      snapshot,
      snapshot.coordinator,
      [],
      [],
      "publication",
    ).nodes.map((n) => n.repository),
  ).toEqual(["example/publisher"]);
});
