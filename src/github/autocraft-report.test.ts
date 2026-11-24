import { expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { parseAutocraftReport } from "./autocraft-schema";
import { readAutocraftReport } from "./autocraft-report";
import type { GithubTransport } from "./transport";
const head = "a".repeat(40),
  source = "b".repeat(40),
  now = 1795480000000;
const policy = { repositories: { "example/repo": { actions: [] } } };
const digest = createHash("sha256")
  .update(JSON.stringify(policy))
  .digest("hex");
export const fixture = () => ({
  schemaVersion: 1,
  kind: "lapis-autocraft-operations",
  observedAt: new Date(now).toISOString(),
  sourceRevision: source,
  policyDigest: digest,
  worker: {
    healthy: true,
    enabled: true,
    phase: "idle",
    actor: "fixture",
    actorId: 12,
    lastScanAt: now,
  },
  dependency: {
    state: "current",
    sourceRevision: source,
    reason: "Qualified dependencies",
  },
  coverage: {
    total: 1,
    shown: 1,
    complete: true,
    deploymentsTotal: 0,
    deploymentsShown: 0,
  },
  deployments: [],
  rows: [
    {
      repository: "example/repo",
      number: 1,
      head,
      base: source,
      url: "https://github.com/example/repo/pull/1",
      action: "observe",
      state: "needs-independent-review",
      reason: "Repair author cannot approve",
      receipt: {
        id: "receipt-1",
        actor: "repair-worker",
        actorId: 44,
        head,
        action: "repair",
        outcome: "succeeded",
        started: now - 1000,
        finished: now,
        evidence: "Exact regression: 1 failure to 0; verified head " + head,
      },
    },
  ],
});
it("validates exact identities, age, policy, bounded receipts and safe links", () => {
  expect(parseAutocraftReport(fixture(), digest, now).state).toBe("current");
  expect(parseAutocraftReport(fixture(), digest, now + 1800001).state).toBe(
    "stale",
  );
  expect(parseAutocraftReport(fixture(), digest, now - 60001).state).toBe(
    "stale",
  );
  expect(parseAutocraftReport(fixture(), "c".repeat(64), now).state).toBe(
    "stale",
  );
  expect(
    parseAutocraftReport({ ...fixture(), schemaVersion: 2 }, digest, now).state,
  ).toBe("unsupported");
  for (const change of [
    () => {
      const f = fixture();
      f.rows[0]!.url = "https://evil.test";
      return f;
    },
    () => {
      const f = fixture();
      f.rows[0]!.receipt.head = "main";
      return f;
    },
    () => ({ ...fixture(), deployments: [{ repository: "../escape" }] }),
    () => ({ ...fixture(), rows: Array(101).fill(fixture().rows[0]) }),
  ])
    expect(parseAutocraftReport(change(), digest, now).state).toBe(
      "unavailable",
    );
  const extended = {
    ...fixture(),
    secret: "must not retain",
    worker: { ...fixture().worker, extra: "discard" },
    rows: [{ ...fixture().rows[0], command: { kind: "merge" } }],
  };
  expect(
    JSON.stringify(parseAutocraftReport(extended, digest, now)),
  ).not.toMatch(/must not retain|discard|"command"/);
});
it("reads immutable private report and policy without persisting raw bodies and verifies source ancestry", async () => {
  let status = "ahead";
  const read = vi.fn(async (path: string) =>
    path.includes("/git/ref/")
      ? { object: { sha: head } }
      : path.includes("/compare/")
        ? { status }
        : path.includes("/config/")
          ? policy
          : fixture(),
  );
  const client = { read } as unknown as GithubTransport;
  const evidence = await readAutocraftReport(
    client,
    new AbortController().signal,
    {},
    now,
  );
  expect(evidence.state).toBe("current");
  expect(evidence.sourceRevision).toBe(head);
  expect(
    read.mock.calls.some(([path]) => path.endsWith("report.json?ref=" + head)),
  ).toBe(true);
  for (const call of read.mock.calls)
    expect((call as unknown[])[2]).toMatchObject({ fresh: true });
  status = "diverged";
  expect(
    (await readAutocraftReport(client, new AbortController().signal, {}, now))
      .state,
  ).toBe("unavailable");
});
it("rejects duplicated PR identities instead of rendering ambiguous receipts", () => {
  const f = fixture();
  f.rows.push({ ...f.rows[0]! });
  f.coverage.total = 2;
  f.coverage.shown = 2;
  expect(parseAutocraftReport(f, digest, now).state).toBe("unavailable");
});

it("rechecks cached report age without repeating provider reads", async () => {
  const { GithubReadPort } = await import("./read-port");
  let time = now;
  const value = fixture();
  value.observedAt = new Date(now - 1_740_000).toISOString();
  const read = vi.fn(async (path: string) =>
    path.includes("/git/ref/")
      ? { object: { sha: head } }
      : path.includes("/compare/")
        ? { status: "ahead" }
        : path.includes("/config/")
          ? policy
          : value,
  );
  const port = new GithubReadPort(
    { read } as unknown as GithubTransport,
    () => ({ additions: [], exclusions: [] }),
    () => time,
  );
  expect(
    (await port.readAutocraftReport(new AbortController().signal)).state,
  ).toBe("current");
  const calls = read.mock.calls.length;
  time += 120_000;
  expect(
    (await port.readAutocraftReport(new AbortController().signal)).state,
  ).toBe("stale");
  expect(read.mock.calls.length).toBe(calls);
  await port.drain();
});
