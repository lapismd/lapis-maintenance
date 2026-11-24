import type { AutocraftEvidence } from "./autocraft-types";
import type { MaintenanceReadPort } from "./types";
/** Lazy, independently cancellable presentation evidence, outside command state. */
export class AutocraftReports {
  evidence = $state.raw<AutocraftEvidence | null>(null);
  loading = $state(false);
  #sequence = 0;
  #abort?: AbortController;
  #disposed = false;
  constructor(private read: MaintenanceReadPort) {}
  async refresh(force = false) {
    if (this.#disposed || !this.read.readAutocraftReport) return;
    const sequence = ++this.#sequence;
    this.#abort?.abort();
    this.#abort = new AbortController();
    this.loading = true;
    try {
      const evidence = await this.read.readAutocraftReport(this.#abort.signal, {
        force,
      });
      if (!this.#disposed && sequence === this.#sequence)
        this.evidence = {
          ...evidence,
          report: evidence.report ?? this.evidence?.report,
        };
    } catch {
      if (!this.#disposed && sequence === this.#sequence)
        this.evidence = {
          ...this.evidence,
          state: "unavailable",
          reason:
            "AutoCraft report unavailable. Manual controls remain available.",
        };
    } finally {
      if (!this.#disposed && sequence === this.#sequence) this.loading = false;
    }
  }
  clear() {
    ++this.#sequence;
    this.#abort?.abort();
    this.evidence = null;
    this.loading = false;
  }
  dispose() {
    this.#disposed = true;
    this.clear();
  }
}
