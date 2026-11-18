import { expect, it } from "vitest";
import controlled from "../../catalog/operations/scoped-report.json";
import { MemoryResponseCache } from "./response-cache";
import { RetainedResponseCache } from "./retained-cache";
import type {
  CoordinatorEvidence,
  WaveReport,
} from "../maintenance/operator-types";
it("revalidates scope retained by the old permissive version2 resource before presentation", async () => {
  const disk = new MemoryResponseCache(),
    cache = new RetainedResponseCache(disk);
  const report = structuredClone(controlled);
  report.nodes[0]!.scopedAdmission.kind = "unreviewed-profile";
  const body = {
    state: "current",
    reason: "Old cached evidence",
    report,
    sourceRevision: "c".repeat(40),
  };
  try {
    await disk.put("coordinator-evidence:v2", { body, fetchedAt: Date.now() });
    const retained = (await cache.get("coordinator-evidence:v2"))!
      .body as CoordinatorEvidence;
    expect(retained.state).toBe("unavailable");
    expect(retained.reason).toContain("invalid");
    expect(retained.report).toBeUndefined();
    expect(body.report.nodes[0]!.scopedAdmission.kind).toBe(
      "unreviewed-profile",
    );
  } finally {
    await cache.close();
  }
});
it("retains valid scope/deferred evidence and source identities without adding command authority", async () => {
  const disk = new MemoryResponseCache(),
    cache = new RetainedResponseCache(disk);
  const report = structuredClone(controlled) as unknown as WaveReport;
  report.observedAt = new Date().toISOString();
  const body: CoordinatorEvidence = {
    state: "current",
    reason: "Controlled data only",
    report,
    sourceRevision: "c".repeat(40),
  };
  try {
    await cache.put("coordinator-evidence:v2", { body, fetchedAt: Date.now() });
    const retained = (await cache.get("coordinator-evidence:v2"))!
      .body as CoordinatorEvidence;
    expect(retained.state).toBe("current");
    expect(retained.sourceRevision).toBe(body.sourceRevision);
    expect(retained.report!.reportId).toBe(report.reportId);
    expect(retained.report!.nodes).toEqual(report.nodes);
    expect(
      retained.report!.nodes[0]!.scopedAdmission!.deferredHolds,
    ).toHaveLength(4);
  } finally {
    await cache.close();
  }
});
