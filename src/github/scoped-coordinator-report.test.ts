import { expect, it } from "vitest";
import report from "../../catalog/operations/scoped-report.json";
import { parseCoordinatorReport } from "./coordinator-report";
import { compactCoordinatorEvidence } from "../maintenance/operation-decisions";
import {
  attentionReason,
  type WaveNode,
  type WaveReport,
} from "../maintenance/operator-types";
import {
  operationNeedsAttention,
  operationsScope,
} from "../maintenance/operations";
const now = Date.parse(report.observedAt),
  revision = report.policyRevision;
const input = () => structuredClone(report);
it("keeps the controlled producer SDK-only scope and deferred private work visible", () => {
  const evidence = parseCoordinatorReport(input(), revision, now),
    node = evidence.report!.nodes[0]!;
  expect(evidence.state).toBe("current");
  expect(attentionReason(node)).toContain("SDK-only");
  expect(operationNeedsAttention(node)).toBe(true);
  expect(
    operationsScope(null, evidence, [], [], "@lapismd/ai").nodes,
  ).toHaveLength(1);
});
for (const [name, mutate] of [
  [
    "unknown kind",
    (v: ReturnType<typeof input>) =>
      (v.nodes[0]!.scopedAdmission.kind = "other"),
  ],
  [
    "missing hash",
    (v: ReturnType<typeof input>) =>
      (v.nodes[0]!.scopedAdmission.grantSha256 = ""),
  ],
  [
    "oversized deferred list",
    (v: ReturnType<typeof input>) =>
      (v.nodes[0]!.scopedAdmission.deferredHolds = Array(129).fill("held")),
  ],
  [
    "malformed source facts",
    (v: ReturnType<typeof input>) =>
      (v.nodes[0]!.sourceHoldFacts[0]!.message = ""),
  ],
] as const)
  it(
    "rejects " + name + " instead of reporting full repository admission",
    () => {
      const v = input();
      mutate(v);
      expect(parseCoordinatorReport(v, revision, now).state).toBe(
        "unavailable",
      );
    },
  );
it("rejects invalid optional scope from a previously retained v2 resource", () => {
  const v = input();
  v.nodes[0]!.scopedAdmission.kind = "future";
  expect(
    compactCoordinatorEvidence({
      state: "current",
      reason: "Cached",
      report: v as unknown as WaveReport,
    }).state,
  ).toBe("unavailable");
});
it("keeps old version1 reports without optional producer fields supported", () => {
  const v = input();
  const node = v.nodes[0] as unknown as Record<string, unknown>;
  delete node.scopedAdmission;
  delete node.sourceHoldFacts;
  expect(parseCoordinatorReport(v, revision, now).state).toBe("current");
  expect(operationNeedsAttention(node as unknown as WaveNode)).toBe(false);
});

for (const [name, mutate] of [
  [
    "foreign selected repository",
    (v: ReturnType<typeof input>) =>
      (v.nodes[0]!.updates[0]!.repository = "lapismd/other"),
  ],
  [
    "runtime selected SDK",
    (v: ReturnType<typeof input>) =>
      (v.nodes[0]!.updates[0]!.type = "dependencies"),
  ],
  [
    "selected SDK minor",
    (v: ReturnType<typeof input>) => (v.nodes[0]!.updates[0]!.target = "0.3.0"),
  ],
  [
    "selected private release intent",
    (v: ReturnType<typeof input>) =>
      ((
        v.nodes[0]!.updates[0] as unknown as { releaseIntent: string }
      ).releaseIntent = "@lapismd/lapis-desktop"),
  ],
  [
    "bad source SHA",
    (v: ReturnType<typeof input>) => (v.nodes[0]!.sourceSha = "a".repeat(64)),
  ],
  [
    "unqualified source",
    (v: ReturnType<typeof input>) => (v.nodes[0]!.acceptance.state = "failed"),
  ],
  [
    "unsupported scoped field",
    (v: ReturnType<typeof input>) =>
      ((
        v.nodes[0]!.scopedAdmission as unknown as Record<string, unknown>
      ).override = true),
  ],
  [
    "missing paired hold",
    (v: ReturnType<typeof input>) =>
      v.nodes[0]!.scopedAdmission.deferredHolds.pop(),
  ],
  [
    "changed paired source fact",
    (v: ReturnType<typeof input>) =>
      (v.nodes[0]!.sourceHoldFacts[0]!.range = "^9.0.0"),
  ],
  [
    "unknown deferred hold kind",
    (v: ReturnType<typeof input>) =>
      (v.nodes[0]!.scopedAdmission.deferredHoldFacts[0]!.kind =
        "unknown-nonportable"),
  ],
  [
    "unreviewed deferred package hold",
    (v: ReturnType<typeof input>) =>
      (v.nodes[0]!.scopedAdmission.deferredHoldFacts[0]!.name =
        "@lapismd/other"),
  ],
  [
    "deferred selected SDK",
    (v: ReturnType<typeof input>) =>
      (v.nodes[0]!.scopedAdmission.deferredUpdates[0]!.name =
        "@lapismd/spec-validator"),
  ],
  [
    "selected missing admission",
    (v: ReturnType<typeof input>) =>
      (v.nodes[0]!.admittedUpdates[0]!.target = "9.0.0"),
  ],
  [
    "oversized UTF8 scope",
    (v: ReturnType<typeof input>) => {
      v.nodes[0]!.scopedAdmission.deferredHolds = Array(20).fill(
        "é".repeat(2000),
      );
    },
  ],
] as const)
  it("holds " + name + " without mutation", () => {
    const v = input();
    mutate(v);
    const saved = structuredClone(v);
    expect(parseCoordinatorReport(v, revision, now).state).toBe("unavailable");
    expect(v).toEqual(saved);
  });
it("preserves zero selected updates without claiming all deferred work is complete", () => {
  const v = input();
  v.nodes[0]!.updates = [];
  v.nodes[0]!.admittedUpdates = [];
  v.nodes[0]!.status = "unchanged";
  const e = parseCoordinatorReport(v, revision, now);
  expect(e.state).toBe("current");
  expect(operationNeedsAttention(e.report!.nodes[0]!)).toBe(true);
  expect(attentionReason(e.report!.nodes[0]!)).toContain("SDK-only");
});
it("labels stale, future and policy-mismatched scoped observations explicitly", () => {
  expect(parseCoordinatorReport(input(), revision, now + 86400001).state).toBe(
    "stale",
  );
  expect(parseCoordinatorReport(input(), revision, now - 60001).state).toBe(
    "stale",
  );
  expect(parseCoordinatorReport(input(), "c".repeat(40), now).state).toBe(
    "stale",
  );
  expect(
    compactCoordinatorEvidence(
      {
        state: "current",
        reason: "Cached",
        report: input() as unknown as WaveReport,
      },
      now + 86400001,
    ).state,
  ).toBe("stale");
});
it("does not require ordinary source facts to account for global or later holds", () => {
  const v = input(),
    node = v.nodes[0] as unknown as Record<string, unknown>;
  delete node.scopedAdmission;
  node.holds = ["outside pilot phase", "unknown branch coverage"];
  node.sourceHoldFacts = [
    { kind: "unknown-nonportable", message: "Source nonportable coordinate" },
  ];
  expect(parseCoordinatorReport(v, revision, now).state).toBe("current");
});
