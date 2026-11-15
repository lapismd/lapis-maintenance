import { expect, it, vi } from "vitest";
import { OperatorReports } from "./operator-report.svelte";
import type { MaintenanceReadPort } from "./types";
import type { CoordinatorEvidence } from "./operator-types";
it("loads coordinator evidence only when explicitly requested", async () => {
  const readCoordinatorReport = vi
    .fn()
    .mockResolvedValue({ state: "unavailable", reason: "Missing report" });
  const reports = new OperatorReports({
    readCoordinatorReport,
  } as unknown as MaintenanceReadPort);
  expect(readCoordinatorReport).not.toHaveBeenCalled();
  await reports.refresh();
  expect(reports.evidence?.state).toBe("unavailable");
  expect(reports.loading).toBe(false);
  reports.dispose();
});
it("rejects out-of-order/disposed evidence and aborts old requests", async () => {
  const pending: {
    resolve: (value: CoordinatorEvidence) => void;
    signal: AbortSignal;
  }[] = [];
  const reports = new OperatorReports({
    readCoordinatorReport: (signal: AbortSignal) =>
      new Promise<CoordinatorEvidence>((resolve) =>
        pending.push({ resolve, signal }),
      ),
  } as unknown as MaintenanceReadPort);
  const first = reports.refresh(),
    second = reports.refresh();
  expect(pending[0]!.signal.aborted).toBe(true);
  pending[1]!.resolve({ state: "current", reason: "Latest" });
  await second;
  pending[0]!.resolve({ state: "stale", reason: "Old" });
  await first;
  expect(reports.evidence?.reason).toBe("Latest");
  const third = reports.refresh();
  reports.dispose();
  expect(pending[2]!.signal.aborted).toBe(true);
  pending[2]!.resolve({ state: "current", reason: "Disposed" });
  await third;
  expect(reports.evidence).toBeNull();
});
