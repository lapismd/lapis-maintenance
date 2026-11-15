import { describe, expect, it } from "vitest";
import { parseCoordinatorReport } from "./coordinator-report";
const now = Date.parse("2026-11-15T20:00:00Z");
const revision = "a".repeat(40);
const report = () => ({
  schemaVersion: 1,
  kind: "lapis-dependency-waves",
  observedAt: new Date(now).toISOString(),
  policyRevision: revision,
  generation: 1,
  reportId: "b".repeat(64),
  nodes: [],
  releases: [],
  publications: [],
  operations: [],
  coverage: [],
});
describe("coordinator report boundary", () => {
  it("accepts a current version1 public report", () =>
    expect(parseCoordinatorReport(report(), revision, now).state).toBe(
      "current",
    ));
  it("rejects unknown versions and malformed decisions", () => {
    expect(
      parseCoordinatorReport({ ...report(), schemaVersion: 2 }, revision, now)
        .state,
    ).toBe("unsupported");
    expect(
      parseCoordinatorReport(
        { ...report(), nodes: [{ repository: "private/secret" }] },
        revision,
        now,
      ).state,
    ).toBe("unavailable");
  });
  it("labels old reports and policy revisions stale while retaining evidence", () => {
    expect(parseCoordinatorReport(report(), "c".repeat(40), now).state).toBe(
      "stale",
    );
    expect(
      parseCoordinatorReport(report(), revision, now + 25 * 3600000).state,
    ).toBe("stale");
  });
});
it("validates a populated version1 report including operation decision reasons", async () => {
  const { operatorFixture } = await import("../../catalog/operations/fixtures");
  const evidence = parseCoordinatorReport(
    operatorFixture().coordinator!.report,
    revision,
    now,
  );
  expect(evidence.state).toBe("current");
  expect(evidence.report?.operations[0]?.reason).toContain("qualification");
  expect(evidence.report?.nodes[0]?.admittedUpdates).toEqual([]);
  const malformed = structuredClone(operatorFixture().coordinator!.report!);
  malformed.nodes[0]!.admittedUpdates = [
    {
      name: "@example/unknown",
      current: "1.0.0",
      target: "9.0.0",
      compatibility: "breaking",
    },
  ];
  expect(parseCoordinatorReport(malformed, revision, now).state).toBe(
    "unavailable",
  );
});
it("pins report reads to a resolved immutable branch commit", async () => {
  const { readCoordinatorReport } = await import("./coordinator-report");
  const { vi } = await import("vitest");
  const read = vi.fn(async (path: string) =>
    path.includes("git/ref/")
      ? { object: { sha: "d".repeat(40) } }
      : path.endsWith("commits/main")
        ? { sha: revision }
        : report(),
  );
  const result = await readCoordinatorReport(
    { read } as unknown as import("./transport").GithubTransport,
    new AbortController().signal,
    {},
    now,
  );
  expect(result.state).toBe("current");
  expect(result.sourceRevision).toBe("d".repeat(40));
  expect(read.mock.calls[2]?.[0]).toBe(
    `/repos/lapismd/dependency-automation/contents/report.json?ref=${"d".repeat(40)}`,
  );
});
