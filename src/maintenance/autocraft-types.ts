export const autocraftStates = [
  "ready-to-merge",
  "needs-review",
  "needs-repair",
  "needs-update",
  "waiting-for-ci",
  "dependency-hold",
  "held",
  "running",
  "needs-independent-review",
  "waiting-for-refresh",
  "post-merge-checks-passed",
  "post-merge-failed",
  "merged-awaiting-rollout",
] as const;
export interface AutocraftReceipt {
  id: string;
  actor: string | null;
  actorId: number | null;
  head: string;
  action: string;
  outcome: string | null;
  started: number;
  finished: number | null;
  evidence: string;
}
export interface AutocraftRow {
  repository: string;
  number: number;
  head: string;
  base?: string;
  url: string;
  state: (typeof autocraftStates)[number];
  action: string;
  reason: string;
  receipt: AutocraftReceipt | null;
  rollout?: {
    state: string;
    head: string | null;
    urls: string[];
    observedAt: string;
  } | null;
}
export interface AutocraftReport {
  schemaVersion: 1;
  kind: "lapis-autocraft-operations";
  observedAt: string;
  sourceRevision: string;
  policyDigest: string;
  worker: {
    healthy: boolean;
    enabled: boolean;
    phase: string;
    actor: string;
    actorId: number;
    lastScanAt: number | null;
  };
  dependency: { state: string; sourceRevision: string | null; reason: string };
  coverage: {
    total: number;
    shown: number;
    complete: boolean;
    deploymentsTotal: number;
    deploymentsShown: number;
  };
  rows: AutocraftRow[];
  deployments: {
    repository: string;
    run: number;
    head: string;
    environment: string;
    environmentId: number;
    canApprove: boolean;
  }[];
}
export interface AutocraftEvidence {
  state: "current" | "stale" | "unsupported" | "unavailable";
  reason: string;
  report?: AutocraftReport;
  sourceRevision?: string;
}
