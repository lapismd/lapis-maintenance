import { primaryAttention } from "./attention";

export type AttentionCategory =
  | "rollout"
  | "branch-reconciliation"
  | "publication"
  | "source-preparation"
  | "qualification"
  | "policy-exclusion"
  | "product-constraint"
  | "other";
export interface AttentionItem {
  code: string;
  category: AttentionCategory;
  summary: string;
  detail: string;
  remediation: string;
  repository?: string;
  sourceSha?: string;
  branch?: string;
  package?: string;
  path?: string;
}
export interface WaveUpdate {
  name: string;
  current: string;
  target: string;
  compatibility: string;
  path?: string;
  type?: string;
  repository?: string;
  range?: string;
  targetRange?: string;
  updateType?: string;
  releaseIntent?: string | null;
  consumer?: string;
  basis?: string;
}
export interface SourceHoldFact {
  message: string;
  kind: string;
  path?: string;
  type?: string;
  name?: string;
  range?: string;
}
export interface ScopedAdmission {
  kind: "desktop-sdk-development";
  grantSha256: string;
  policySha256: string;
  descriptorSha256: string;
  deferredUpdates: WaveUpdate[];
  deferredHolds: string[];
  deferredHoldFacts: SourceHoldFact[];
  deferredWaits: WaveNode["waits"];
}
export interface WaveNode {
  visibility: "public";
  repository: string;
  sourceSha: string;
  operationId: string;
  status: string;
  holds: string[];
  attention?: AttentionItem[];
  waits: {
    package: string;
    repository: string;
    reason: string;
    path?: string;
  }[];
  updates: WaveUpdate[];
  scopedAdmission?: ScopedAdmission;
  sourceHoldFacts?: SourceHoldFact[];
  admittedUpdates?: WaveNode["updates"];
  branchHolds?: {
    branch: string;
    head: string;
    family: string | null;
    reason: string;
  }[];
  acceptance: { state: string; reason: string };
  ownership: { state: string; reason: string; pr?: number; head?: string };
}
export interface WaveReport {
  schemaVersion: 1;
  kind: "lapis-dependency-waves";
  reportId: string;
  observedAt: string;
  policyRevision: string;
  generation: number;
  coverage: { opaqueId: string; reason: string }[];
  nodes: WaveNode[];
  releases: {
    name: string;
    repository: string;
    sourceSha: string;
    baseline: string;
    status: string;
    version?: string;
    requires: { name: string; type: string; target: string }[];
  }[];
  publications: { name: string; version: string; integrity: string }[];
  operations: {
    id: string;
    repository: string;
    sourceSha: string;
    policyRevision: string;
    status: string;
    observedAt: string;
    reason: string;
    ownership: string;
    acceptance: string;
    targets: { name: string; target: string; path: string; type: string }[];
  }[];
}
export interface CoordinatorEvidence {
  operationHistory?: "latest-and-previous";
  state: "current" | "stale" | "unsupported" | "unavailable";
  reason: string;
  report?: WaveReport;
  url?: string;
  sourceRevision?: string;
}
export function attentionReason(node: WaveNode): string {
  if (node.scopedAdmission)
    return `SDK-only · ${ordinaryAttentionReason(node)} · repository work remains deferred`;
  return ordinaryAttentionReason(node);
}
function ordinaryAttentionReason(node: WaveNode): string {
  const attention = primaryAttention(node);
  if (attention) return attention.summary;
  if (node.ownership.state === "repair-owned") return "Manual repair ownership";
  if (node.updates.some((u) => u.compatibility === "breaking"))
    return "Compatibility decision";
  if (node.status === "failed")
    return /publish|publication|registry/i.test(node.acceptance.reason)
      ? "Publication failure"
      : "Qualification failure";
  if (
    /approval|action.required/i.test(
      [node.acceptance.reason, ...node.holds].join(" "),
    )
  )
    return "Approval wait";
  return (
    (
      {
        "upstream-wait": "Expected upstream wait",
        "publication-wait": "Waiting for registry publication",
        "qualification-wait": "Waiting for consumer qualification",
        uncertain: "Uncertain write: reconciliation required",
        admitted: "Running compatible update",
        held: node.holds[0] ?? "Explicit hold",
        unchanged: "No update required",
      } as Record<string, string>
    )[node.status] ?? `Coordinator state: ${node.status}`
  );
}
