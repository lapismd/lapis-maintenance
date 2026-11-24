import { AutocraftReports } from "./autocraft-report.svelte";
import type { CoordinatorEvidence } from "./operator-types";
import type { MaintenanceReadPort } from "./types";
/** Independent lazy evidence: cached inbox startup must never wait for coordinator networking. */
export class OperatorReports {
  evidence = $state.raw<CoordinatorEvidence | null>(null);
  loading = $state(false);
  #sequence = 0;
  #abort?: AbortController;
  #disposed = false;
  readonly autocraft: AutocraftReports;
  constructor(private read: MaintenanceReadPort) {
    this.autocraft = new AutocraftReports(read);
  }
  async refresh(force = false) {
    if (this.#disposed) return;
    void this.autocraft.refresh(force);
    if (!this.read.readCoordinatorReport) return;
    const sequence = ++this.#sequence;
    this.#abort?.abort();
    this.#abort = new AbortController();
    this.loading = true;
    try {
      const evidence = await this.read.readCoordinatorReport(
        this.#abort.signal,
        { force },
      );
      if (!this.#disposed && sequence === this.#sequence)
        this.evidence = {
          ...this.evidence,
          ...evidence,
          report: evidence.report ?? this.evidence?.report,
        };
    } catch {
      if (!this.#disposed && sequence === this.#sequence)
        this.evidence = {
          ...this.evidence,
          state: "unavailable",
          reason:
            "Coordinator report unavailable. Manual controls remain available.",
        };
    } finally {
      if (!this.#disposed && sequence === this.#sequence) this.loading = false;
    }
  }
  clear() {
    this.autocraft.clear();
    ++this.#sequence;
    this.#abort?.abort();
    this.evidence = null;
    this.loading = false;
  }
  dispose() {
    this.#disposed = true;
    this.autocraft.dispose();
    this.clear();
  }
}
