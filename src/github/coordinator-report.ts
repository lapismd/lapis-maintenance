import type {
  CoordinatorEvidence,
  WaveReport,
} from "../maintenance/operator-types";
import { validRepository } from "./models";
import { compactCoordinatorEvidence } from "../maintenance/operation-decisions";
import {
  GithubError,
  type GithubTransport,
  type ReadOptions,
} from "./transport";
const root = "/repos/lapismd/dependency-automation";
export const reportPath = `${root}/contents/report.json?ref=automation%2Fdependency-wave-state`;
const string = (v: unknown): v is string =>
  typeof v === "string" && v.length <= 4000;
const sha = (v: unknown): v is string =>
  string(v) && /^[a-f0-9]{40,64}$/.test(v);
const list = (v: unknown): v is unknown[] =>
  Array.isArray(v) && v.length <= 5000;
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const strings = (v: unknown) => list(v) && v.every(string);
const stateReason = (v: unknown) =>
  object(v) && string(v.state) && string(v.reason);
const repository = (v: unknown): v is string => string(v) && validRepository(v);
/** Validate before exposing data; unsupported revisions never become current evidence. */
export function parseCoordinatorReport(
  value: unknown,
  revision: string,
  now = Date.now(),
): CoordinatorEvidence {
  if (object(value) && value.schemaVersion !== 1)
    return {
      state: "unsupported",
      reason:
        "Unsupported coordinator report version. Manual controls remain available.",
    };
  if (
    !object(value) ||
    value.kind !== "lapis-dependency-waves" ||
    !sha(value.policyRevision) ||
    !sha(value.reportId) ||
    !string(value.observedAt) ||
    !Number.isSafeInteger(value.generation) ||
    Number(value.generation) < 0 ||
    !list(value.nodes) ||
    !list(value.releases) ||
    !list(value.operations) ||
    !list(value.publications) ||
    !list(value.coverage)
  )
    return unavailable();
  const { nodes, releases, operations, publications, coverage } = value;
  if (
    nodes.some(
      (n) =>
        !object(n) ||
        n.visibility !== "public" ||
        !repository(n.repository) ||
        !sha(n.sourceSha) ||
        !string(n.operationId) ||
        !string(n.status) ||
        !strings(n.holds) ||
        !stateReason(n.acceptance) ||
        !stateReason(n.ownership) ||
        !list(n.waits) ||
        n.waits.some(
          (w) =>
            !object(w) ||
            !string(w.package) ||
            !repository(w.repository) ||
            !string(w.reason),
        ) ||
        (n.branchHolds !== undefined &&
          (!list(n.branchHolds) ||
            n.branchHolds.some(
              (h) =>
                !object(h) ||
                !string(h.branch) ||
                !sha(h.head) ||
                !(h.family === null || string(h.family)) ||
                !string(h.reason),
            ))) ||
        (n.admittedUpdates !== undefined &&
          (!list(n.admittedUpdates) ||
            n.admittedUpdates.some(
              (a) =>
                !object(a) ||
                !list(n.updates) ||
                !n.updates.some(
                  (u) =>
                    object(u) &&
                    ["name", "current", "target", "path", "type"].every(
                      (k) => a[k] === u[k],
                    ),
                ),
            ))) ||
        !list(n.updates) ||
        n.updates.some(
          (u) =>
            !object(u) ||
            !string(u.name) ||
            !string(u.current) ||
            !string(u.target) ||
            !["breaking", "compatible"].includes(String(u.compatibility)),
        ),
    )
  )
    return unavailable();
  if (
    coverage.some(
      (c) => !object(c) || !string(c.opaqueId) || !string(c.reason),
    ) ||
    releases.some(
      (r) =>
        !object(r) ||
        !string(r.name) ||
        !repository(r.repository) ||
        !sha(r.sourceSha) ||
        !string(r.baseline) ||
        !string(r.status) ||
        !list(r.requires) ||
        r.requires.some(
          (d) =>
            !object(d) ||
            !string(d.name) ||
            !string(d.type) ||
            !string(d.target),
        ),
    ) ||
    publications.some(
      (p) =>
        !object(p) ||
        !string(p.name) ||
        !string(p.version) ||
        !string(p.integrity),
    ) ||
    operations.some(
      (o) =>
        !object(o) ||
        !string(o.id) ||
        !repository(o.repository) ||
        !sha(o.sourceSha) ||
        !sha(o.policyRevision) ||
        !string(o.status) ||
        !string(o.observedAt) ||
        !Number.isFinite(Date.parse(o.observedAt)) ||
        Date.parse(o.observedAt) >
          Date.parse(value.observedAt as string) + 60_000 ||
        !string(o.reason) ||
        !string(o.ownership) ||
        !string(o.acceptance) ||
        !list(o.targets) ||
        o.targets.some(
          (t) =>
            !object(t) ||
            !string(t.name) ||
            !string(t.target) ||
            !string(t.path) ||
            !string(t.type),
        ),
    )
  )
    return unavailable();
  const report = value as unknown as WaveReport;
  const time = Date.parse(report.observedAt);
  const stale =
    !Number.isFinite(time) ||
    now - time > 86400000 ||
    time > now + 60000 ||
    report.policyRevision !== revision;
  return {
    state: stale ? "stale" : "current",
    reason: stale
      ? "Coordinator evidence is stale or its policy revision differs from current main. Refresh before relying on its decisions."
      : "Current coordinator evidence. GitHub remains authoritative for every command.",
    report,
  };
}
function unavailable(): CoordinatorEvidence {
  return {
    state: "unavailable",
    reason:
      "Coordinator report is missing or invalid. Manual controls remain available.",
  };
}
export async function readCoordinatorReport(
  client: GithubTransport,
  signal: AbortSignal,
  options: ReadOptions,
  now = Date.now(),
): Promise<CoordinatorEvidence> {
  try {
    const [ref, revision] = await Promise.all([
      client.read<{ object: { sha: string } }>(
        `${root}/git/ref/heads/automation/dependency-wave-state`,
        signal,
        options,
      ),
      client.read<{ sha: string }>(`${root}/commits/main`, signal, options),
    ]);
    if (!sha(ref?.object?.sha)) return unavailable();
    const value = await client.read<unknown>(
      `${root}/contents/report.json?ref=${ref.object.sha}`,
      signal,
      { ...options, accept: "application/vnd.github.raw+json" },
    );
    const decoded = typeof value === "string" ? JSON.parse(value) : value;
    return compactCoordinatorEvidence({
      ...parseCoordinatorReport(decoded, revision.sha, now),
      sourceRevision: ref.object.sha,
      url: "https://github.com/lapismd/dependency-automation/tree/automation/dependency-wave-state",
    });
  } catch (error) {
    signal.throwIfAborted();
    if (error instanceof GithubError && error.status === 401) throw error;
    return unavailable();
  }
}
