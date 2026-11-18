import type { CoordinatorEvidence } from "./operator-types";
import { validRepository } from "../github/models";
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown): v is string =>
  typeof v === "string" &&
  v.length > 0 &&
  v.length <= 4000 &&
  !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(
    v,
  ) &&
  !v.includes("\0");
const digest = (v: unknown) =>
  typeof v === "string" && /^[a-f0-9]{64}$/.test(v);
const rows = (v: unknown): v is unknown[] =>
  Array.isArray(v) && v.length <= 128;
const keys = (
  v: Record<string, unknown>,
  allowed: string[],
  required = allowed,
) =>
  Object.keys(v).every((k) => allowed.includes(k)) &&
  required.every((k) => Object.hasOwn(v, k));
const packageName = (v: unknown) =>
  text(v) && /^@(?:lapismd|lapis-notes)\/[a-z0-9._-]+$/.test(v);
const withinBytes = (v: unknown) => {
  try {
    return new TextEncoder().encode(JSON.stringify(v)).length <= 65536;
  } catch {
    return false;
  }
};
const factKeys = ["message", "kind", "path", "type", "name", "range"];
function fact(v: unknown) {
  return (
    object(v) &&
    keys(v, factKeys, ["message", "kind"]) &&
    Object.values(v).every(text)
  );
}
const frozen = new Map([
  ["@lapismd/ai", "dependencies"],
  ["@lapis-notes/app-profile", "dependencies"],
  ["@lapis-notes/lapis-plugin-tasks", "devDependencies"],
]);
function privateFact(v: unknown) {
  return (
    fact(v) &&
    object(v) &&
    keys(v, factKeys) &&
    v.path === "package.json" &&
    text(v.name) &&
    frozen.get(v.name) === v.type &&
    ["unavailable-registry", "unpublished-registry"].includes(String(v.kind))
  );
}
const updateKeys = [
  "name",
  "range",
  "type",
  "repository",
  "path",
  "consumer",
  "current",
  "target",
  "targetRange",
  "updateType",
  "compatibility",
  "releaseIntent",
  "basis",
];
const sdk = "@lapismd/spec-validator",
  desktop = "lapismd/lapis-desktop";
function update(v: unknown) {
  return (
    object(v) &&
    keys(v, updateKeys) &&
    Object.entries(v).every(([k, value]) =>
      k === "releaseIntent" ? value === null || text(value) : text(value),
    ) &&
    packageName(v.name) &&
    v.repository === desktop &&
    v.path === "package.json" &&
    v.consumer === "@lapismd/lapis-desktop" &&
    [
      "dependencies",
      "devDependencies",
      "optionalDependencies",
      "peerDependencies",
    ].includes(String(v.type)) &&
    ["compatible", "breaking"].includes(String(v.compatibility)) &&
    ["patch", "minor", "major"].includes(String(v.updateType))
  );
}
function selected(v: unknown) {
  if (
    !update(v) ||
    !object(v) ||
    v.name !== sdk ||
    v.type !== "devDependencies" ||
    v.compatibility !== "compatible" ||
    v.updateType !== "patch" ||
    v.releaseIntent !== null ||
    v.targetRange !== v.target
  )
    return false;
  const version = (value: unknown) =>
    typeof value === "string" &&
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value)
      ? value.split(".").map(Number)
      : null;
  const a = version(v.current),
    b = version(v.target);
  return (
    !!a &&
    !!b &&
    [...a, ...b].every(Number.isSafeInteger) &&
    a[0] === b[0] &&
    a[1] === b[1] &&
    b[2]! > a[2]!
  );
}
function wait(v: unknown) {
  return (
    object(v) &&
    keys(
      v,
      ["package", "path", "repository", "reason"],
      ["package", "repository", "reason"],
    ) &&
    packageName(v.package) &&
    text(v.repository) &&
    validRepository(v.repository) &&
    text(v.reason) &&
    (v.path === undefined || text(v.path))
  );
}
const signature = (value: unknown) =>
  object(value) ? factKeys.map((k) => value[k]).join("\0") : "";
/** Presentation validation only: no field or digest grants GitHub write authority. */
export function validOptionalScope(node: unknown): boolean {
  if (!object(node)) return false;
  if (
    node.sourceHoldFacts !== undefined &&
    (!rows(node.sourceHoldFacts) ||
      !node.sourceHoldFacts.every(fact) ||
      !withinBytes(node.sourceHoldFacts))
  )
    return false;
  if (node.scopedAdmission === undefined) return true;
  const s = node.scopedAdmission,
    updates = node.updates;
  if (
    !object(s) ||
    !keys(s, [
      "kind",
      "grantSha256",
      "policySha256",
      "descriptorSha256",
      "deferredUpdates",
      "deferredHolds",
      "deferredHoldFacts",
      "deferredWaits",
    ]) ||
    s.kind !== "desktop-sdk-development" ||
    ![s.grantSha256, s.policySha256, s.descriptorSha256].every(digest) ||
    node.repository !== desktop ||
    typeof node.sourceSha !== "string" ||
    !/^[a-f0-9]{40}$/.test(node.sourceSha) ||
    !object(node.acceptance) ||
    node.acceptance.state !== "qualified" ||
    !Array.isArray(updates) ||
    updates.length > 1 ||
    !updates.every(selected) ||
    !Array.isArray(node.admittedUpdates) ||
    node.admittedUpdates.length > 1 ||
    !node.admittedUpdates.every(
      (a) =>
        selected(a) &&
        updates.some(
          (u: unknown) =>
            object(u) && object(a) && updateKeys.every((k) => u[k] === a[k]),
        ),
    ) ||
    !Array.isArray(node.waits) ||
    !node.waits.every((w) => wait(w) && object(w) && w.package === sdk) ||
    !rows(s.deferredUpdates) ||
    !s.deferredUpdates.every((u) => update(u) && object(u) && u.name !== sdk) ||
    !rows(s.deferredHolds) ||
    !s.deferredHolds.every(text) ||
    !rows(s.deferredHoldFacts) ||
    !s.deferredHoldFacts.every(privateFact) ||
    !rows(node.sourceHoldFacts) ||
    !rows(s.deferredWaits) ||
    !s.deferredWaits.every((w) => wait(w) && object(w) && w.package !== sdk) ||
    !withinBytes(s)
  )
    return false;
  const facts = s.deferredHoldFacts,
    holds = s.deferredHolds,
    sourceFacts = node.sourceHoldFacts;
  return (
    facts.length === holds.length &&
    facts.length === sourceFacts.length &&
    facts.every(
      (f, i) =>
        object(f) &&
        f.message === holds[i] &&
        signature(f) === signature(sourceFacts[i]),
    )
  );
}
export const invalidScopeReason =
  "Scoped coordinator or source-hold evidence is invalid or unsupported. Repository acceptance is unavailable; manual controls remain available.";
/** Revalidate previously retained optional data before it reaches presentation. */
export function scopedEvidence(
  evidence: CoordinatorEvidence,
  now = Date.now(),
): CoordinatorEvidence {
  if (!evidence.report) return evidence;
  if (
    !Array.isArray(evidence.report.nodes) ||
    !evidence.report.nodes.every(validOptionalScope)
  )
    return {
      ...evidence,
      state: "unavailable",
      reason: invalidScopeReason,
      report: undefined,
    };
  if (
    evidence.state === "current" &&
    evidence.report.nodes.some((n) => n.scopedAdmission)
  ) {
    const time = Date.parse(evidence.report.observedAt);
    if (!Number.isFinite(time) || now - time > 86400000 || time > now + 60000)
      return {
        ...evidence,
        state: "stale",
        reason:
          "Scoped coordinator evidence is stale. Refresh before relying on its SDK-only status.",
      };
  }
  return evidence;
}
