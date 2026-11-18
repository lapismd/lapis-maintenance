import type { MaintenanceSnapshot } from "../../src/maintenance/types";
import type {
  WaveNode,
  WaveReport,
} from "../../src/maintenance/operator-types";
const sha = "a".repeat(40);
/** Synthetic public coordinates only. No harvested operational or private data. */
export function operatorFixture(): MaintenanceSnapshot {
  const base: WaveNode = {
    visibility: "public",
    repository: "example/consumer",
    sourceSha: sha,
    operationId: "b".repeat(64),
    status: "upstream-wait",
    holds: [],
    waits: [
      {
        package: "@example/foundation",
        repository: "example/foundation",
        reason: "Registry version must be available and qualified.",
      },
    ],
    updates: [
      {
        name: "@example/foundation",
        current: "1.0.0",
        target: "1.0.1",
        compatibility: "compatible",
      },
    ],
    admittedUpdates: [],
    branchHolds: [],
    acceptance: { state: "waiting", reason: "Consumer qualification pending." },
    ownership: { state: "bot-owned", reason: "Untouched automation branch." },
  };
  const nodes: WaveNode[] = [
    base,
    {
      ...base,
      repository: "example/repair",
      status: "held",
      holds: ["retained dependency branch requires reconciliation"],
      branchHolds: [
        {
          branch: "lapis-dependencies/lapis-first-party",
          head: "d".repeat(40),
          family: "lapis-first-party",
          reason: "Retained branch requires review before automation resumes.",
        },
      ],
      attention: [
        {
          code: "branch-reconciliation",
          category: "branch-reconciliation",
          summary: "Manual repair ownership",
          detail: "Retained branch requires review before automation resumes.",
          remediation:
            "Review the retained branch, then merge it through a pull request or retire it.",
          repository: "example/repair",
          sourceSha: "d".repeat(40),
          branch: "lapis-dependencies/lapis-first-party",
        },
      ],
      ownership: {
        state: "repair-owned",
        reason: "Manual repair commits require operator ownership.",
      },
    },
    {
      ...base,
      repository: "example/compatibility",
      status: "held",
      updates: [
        { ...base.updates[0]!, target: "2.0.0", compatibility: "breaking" },
      ],
    },
    {
      ...base,
      repository: "example/publisher",
      status: "failed",
      acceptance: {
        state: "failed",
        reason: "Publication failed; preserve already published bytes.",
      },
    },
  ];
  const report: WaveReport = {
    schemaVersion: 1,
    kind: "lapis-dependency-waves",
    reportId: "c".repeat(64),
    observedAt: "2026-11-15T20:00:00Z",
    policyRevision: sha,
    generation: 3,
    coverage: [
      {
        opaqueId: "held-source-1",
        reason: "A held source is inaccessible; identity omitted.",
      },
    ],
    nodes,
    releases: [
      {
        name: "@example/foundation",
        repository: "example/foundation",
        sourceSha: sha,
        baseline: "1.0.0",
        status: "waiting",
        requires: [],
      },
    ],
    publications: [],
    operations: [
      {
        id: base.operationId,
        repository: base.repository,
        sourceSha: sha,
        policyRevision: sha,
        status: base.status,
        reason: "Upstream qualification/publication required.",
        ownership: "bot-owned",
        acceptance: "waiting",
        targets: [
          {
            name: "@example/foundation",
            target: "1.0.1",
            path: "package.json",
            type: "dependencies",
          },
        ],
        observedAt: "2026-11-15T20:00:00Z",
      },
    ],
  };
  return {
    fetchedAt: report.observedAt,
    coordinator: {
      state: "current",
      reason: "Synthetic coordinator evidence · fixture only.",
      report,
    },
    repositories: [{ repository: "example/consumer", available: true }],
    issues: [
      {
        id: 1,
        number: 19,
        repository: "example/compatibility",
        title: "Review major framework compatibility",
        url: "https://github.com/example/compatibility/issues/19",
        updatedAt: report.observedAt,
        category: "compatibility",
      },
    ],
    items: [1, 2].map((n) => ({
      id: `run:example/consumer:${n}`,
      repository: "example/consumer",
      title: `Failed fixture workflow ${n}`,
      kind: "workflow",
      status: "failed",
      category: "product",
      updatedAt: report.observedAt,
      url: `https://github.com/example/consumer/actions/runs/${n}`,
      reasons: ["Current main failure."],
      target: { kind: "workflow", sha, runId: n, attempt: 1 },
      actions: [
        { kind: "rerun-failed", label: "Rerun failed jobs", available: true },
      ],
    })),
  };
}

/** Deliberately out of array order, like a full coordinator audit report. */
export function decisionHistoryFixture(): MaintenanceSnapshot {
  const snapshot = operatorFixture();
  const report = snapshot.coordinator!.report!,
    base = report.operations[0]!;
  report.operations = [
    {
      ...base,
      id: "3".repeat(64),
      observedAt: "2026-11-15T20:00:00Z",
      status: "held",
      reason: "Latest verified policy decision",
    },
    {
      ...base,
      id: "1".repeat(64),
      observedAt: "2026-11-15T18:00:00Z",
      status: "unchanged",
      reason: "Obsolete poll result",
    },
    {
      ...base,
      id: "2".repeat(64),
      observedAt: "2026-11-15T19:00:00Z",
      status: "failed",
      reason: "Previous qualification failed",
    },
  ];
  report.nodes[0] = {
    ...report.nodes[0]!,
    status: "held",
    operationId: "3".repeat(64),
  };
  return snapshot;
}
