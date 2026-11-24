import { validRepository } from "./models";
import {
  autocraftStates,
  type AutocraftEvidence,
  type AutocraftReport,
} from "../maintenance/autocraft-types";
const obj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown, max = 1000): v is string =>
  typeof v === "string" && v.length <= max;
const sha = (v: unknown) => text(v) && /^[a-f0-9]{40}$/.test(v);
const uint = (v: unknown): v is number =>
  Number.isSafeInteger(v) && Number(v) >= 0;
const positive = (v: unknown) => uint(v) && v > 0;
const login = (v: unknown) => text(v) && /^[a-zA-Z0-9-]{1,39}$/.test(v);
const date = (v: unknown): v is string =>
  text(v) && Number.isFinite(Date.parse(v));
const repo = (v: unknown): v is string => text(v) && validRepository(v);
const list = (v: unknown, max: number): v is unknown[] =>
  Array.isArray(v) && v.length <= max;
export const autocraftUnavailable = (): AutocraftEvidence => ({
  state: "unavailable",
  reason:
    "AutoCraft report unavailable or invalid. Manual controls remain available.",
});
function receipt(v: unknown) {
  return (
    v === null ||
    (obj(v) &&
      text(v.id, 200) &&
      (v.actor === null || login(v.actor)) &&
      (v.actorId === null || positive(v.actorId)) &&
      sha(v.head) &&
      ["update", "repair", "review", "merge", "deploy", "verify"].includes(
        String(v.action),
      ) &&
      [null, "succeeded", "held", "failed", "superseded"].includes(
        v.outcome as string | null,
      ) &&
      uint(v.started) &&
      (v.finished === null
        ? v.outcome === null
        : uint(v.finished) && v.finished >= v.started && v.outcome !== null) &&
      text(v.evidence, 2000))
  );
}
function row(v: unknown) {
  if (
    !obj(v) ||
    !repo(v.repository) ||
    !positive(v.number) ||
    !sha(v.head) ||
    (v.base !== undefined && !sha(v.base)) ||
    v.url !== `https://github.com/${v.repository}/pull/${v.number}` ||
    !autocraftStates.includes(v.state as (typeof autocraftStates)[number]) ||
    !["observe", "update", "repair", "review", "merge"].includes(
      String(v.action),
    ) ||
    !text(v.reason, 1000) ||
    !receipt(v.receipt)
  )
    return false;
  const r = v.rollout;
  return (
    r === undefined ||
    r === null ||
    (obj(r) &&
      ["passed", "failed", "pending", "unavailable"].includes(
        String(r.state),
      ) &&
      (r.head === null || sha(r.head)) &&
      date(r.observedAt) &&
      list(r.urls, 100) &&
      r.urls.every(
        (url) =>
          text(url) &&
          url.startsWith(`https://github.com/${v.repository}/actions/runs/`) &&
          /^\d+$/.test(url.split("/").at(-1)!),
      ))
  );
}
/** Copy only the bounded presentation contract; no report field becomes an action. */
export function parseAutocraftReport(
  value: unknown,
  digest: string,
  now = Date.now(),
): AutocraftEvidence {
  if (obj(value) && value.schemaVersion !== 1)
    return {
      state: "unsupported",
      reason:
        "Unsupported AutoCraft report version. Manual controls remain available.",
    };
  if (
    !obj(value) ||
    value.kind !== "lapis-autocraft-operations" ||
    !sha(value.sourceRevision) ||
    !text(value.policyDigest) ||
    !/^[a-f0-9]{64}$/.test(value.policyDigest) ||
    !date(value.observedAt) ||
    !list(value.rows, 100) ||
    !value.rows.every(row) ||
    !list(value.deployments, 50)
  )
    return autocraftUnavailable();
  if (
    new Set(
      value.rows.map(
        (v) =>
          `${(v as Record<string, unknown>).repository}/${(v as Record<string, unknown>).number}`,
      ),
    ).size !== value.rows.length
  )
    return autocraftUnavailable();
  const w = value.worker,
    d = value.dependency,
    c = value.coverage;
  if (
    !obj(w) ||
    typeof w.healthy !== "boolean" ||
    typeof w.enabled !== "boolean" ||
    !login(w.actor) ||
    !positive(w.actorId) ||
    ![
      "starting",
      "scanning",
      "scanned",
      "running",
      "idle",
      "held",
      "succeeded",
      "failed",
      "superseded",
      "disabled",
      "degraded",
    ].includes(String(w.phase)) ||
    !(w.lastScanAt === null || uint(w.lastScanAt)) ||
    !obj(d) ||
    !["current", "stale", "unavailable"].includes(String(d.state)) ||
    !(d.sourceRevision === null || sha(d.sourceRevision)) ||
    !text(d.reason, 1000) ||
    !obj(c) ||
    ![c.total, c.shown, c.deploymentsTotal, c.deploymentsShown].every(uint) ||
    c.shown !== value.rows.length ||
    c.deploymentsShown !== value.deployments.length ||
    Number(c.total) < Number(c.shown) ||
    Number(c.deploymentsTotal) < Number(c.deploymentsShown) ||
    typeof c.complete !== "boolean" ||
    (c.complete &&
      (c.total !== c.shown || c.deploymentsTotal !== c.deploymentsShown))
  )
    return autocraftUnavailable();
  if (
    value.deployments.some(
      (v) =>
        !obj(v) ||
        !repo(v.repository) ||
        !positive(v.run) ||
        !sha(v.head) ||
        !["github-pages", "ci-image"].includes(String(v.environment)) ||
        !positive(v.environmentId) ||
        typeof v.canApprove !== "boolean",
    )
  )
    return autocraftUnavailable();
  // Rebuild the object to discard unknown fields before cache or presentation.
  const report: AutocraftReport = JSON.parse(JSON.stringify(value));
  report.rows = report.rows.map(
    ({
      repository,
      number,
      head,
      base,
      url,
      state,
      action,
      reason,
      receipt,
      rollout,
    }) => ({
      repository,
      number,
      head,
      ...(base ? { base } : {}),
      url,
      state,
      action,
      reason,
      receipt: receipt
        ? {
            id: receipt.id,
            actor: receipt.actor,
            actorId: receipt.actorId,
            head: receipt.head,
            action: receipt.action,
            outcome: receipt.outcome,
            started: receipt.started,
            finished: receipt.finished,
            evidence: receipt.evidence,
          }
        : null,
      ...(rollout
        ? {
            rollout: {
              state: rollout.state,
              head: rollout.head,
              urls: rollout.urls,
              observedAt: rollout.observedAt,
            },
          }
        : {}),
    }),
  );
  const clean: AutocraftReport = {
    schemaVersion: 1,
    kind: report.kind,
    observedAt: report.observedAt,
    sourceRevision: report.sourceRevision,
    policyDigest: report.policyDigest,
    worker: {
      healthy: report.worker.healthy,
      enabled: report.worker.enabled,
      phase: report.worker.phase,
      actor: report.worker.actor,
      actorId: report.worker.actorId,
      lastScanAt: report.worker.lastScanAt,
    },
    dependency: {
      state: report.dependency.state,
      reason: report.dependency.reason,
      sourceRevision: report.dependency.sourceRevision,
    },
    coverage: {
      total: report.coverage.total,
      shown: report.coverage.shown,
      complete: report.coverage.complete,
      deploymentsTotal: report.coverage.deploymentsTotal,
      deploymentsShown: report.coverage.deploymentsShown,
    },
    rows: report.rows,
    deployments: report.deployments.map(
      ({ repository, run, head, environment, environmentId, canApprove }) => ({
        repository,
        run,
        head,
        environment,
        environmentId,
        canApprove,
      }),
    ),
  };
  if (new TextEncoder().encode(JSON.stringify(value)).length > 512 * 1024)
    return autocraftUnavailable();
  const time = Date.parse(report.observedAt),
    stale =
      now - time > 1_800_000 ||
      time > now + 60_000 ||
      digest !== report.policyDigest;
  return {
    state: stale ? "stale" : "current",
    reason: stale
      ? "AutoCraft evidence is older than 30 minutes, future-dated or differs from current policy. Manual controls remain available."
      : "Read-only AutoCraft evidence. GitHub remains authoritative for every command.",
    report: clean,
  };
}
