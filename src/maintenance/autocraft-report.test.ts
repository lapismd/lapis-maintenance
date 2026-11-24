import { expect, it } from "vitest";
import { AutocraftReports } from "./autocraft-report.svelte";
import type { AutocraftEvidence } from "./autocraft-types";
import type { MaintenanceReadPort } from "./types";
it("aborts superseded reads and fences results after disposal", async () => {
  const pending: {
    signal: AbortSignal;
    resolve: (value: AutocraftEvidence) => void;
  }[] = [];
  const reports = new AutocraftReports({
    readAutocraftReport: (signal: AbortSignal) =>
      new Promise<AutocraftEvidence>((resolve) =>
        pending.push({ signal, resolve }),
      ),
  } as MaintenanceReadPort);
  const first = reports.refresh(),
    second = reports.refresh();
  expect(pending[0]!.signal.aborted).toBe(true);
  pending[1]!.resolve({ state: "current", reason: "Latest" });
  await second;
  pending[0]!.resolve({ state: "stale", reason: "Old" });
  await first;
  expect(reports.evidence?.reason).toBe("Latest");
  const last = reports.refresh();
  reports.dispose();
  expect(pending[2]!.signal.aborted).toBe(true);
  pending[2]!.resolve({ state: "current", reason: "Disposed" });
  await last;
  expect(reports.evidence).toBeNull();
});
