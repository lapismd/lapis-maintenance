import { MaintenanceCommands } from "./commands.svelte";
import {
  MaintenanceReadError,
  type MaintenanceDetail,
  type MaintenanceReadPort,
  type MaintenanceCommandPort,
  type MaintenanceSnapshot,
  type ItemStatus,
  type View,
} from "./types";

const priority: Record<ItemStatus, number> = {
  "approval-wait": 0,
  failed: 1,
  unavailable: 1.5,
  "review-needed": 2,
  blocked: 3,
  draft: 4,
  cancelled: 5,
  running: 6,
  passed: 7,
};
/** Host-owned production state. A catalog adapter is injected, never imported. */
export class MaintenanceController {
  snapshot = $state.raw<MaintenanceSnapshot | null>(null);
  detail = $state.raw<MaintenanceDetail | null>(null);
  selectedId = $state<string | null>(null);
  phase = $state<"idle" | "loading" | "refreshing" | "ready" | "error">("idle");
  detailLoading = $state(false);
  error = $state<MaintenanceReadError | null>(null);
  detailError = $state<string | null>(null);
  query = $state("");
  repositories = $state<string[]>([]);
  statuses = $state<ItemStatus[]>([]);
  view = $state<View>("inbox");
  connected = $state(true);
  readonly commands: MaintenanceCommands;
  #read: MaintenanceReadPort;
  #disposed = false;
  #readSequence = 0;
  #detailSequence = 0;
  #readAbort?: AbortController;
  #detailAbort?: AbortController;
  constructor(
    read: MaintenanceReadPort,
    write: MaintenanceCommandPort,
    connected = true,
  ) {
    this.#read = read;
    this.connected = connected;
    this.commands = new MaintenanceCommands(read, write, () =>
      this.refresh(true),
    );
  }
  get items() {
    const query = this.query.toLowerCase().trim();
    return (this.snapshot?.items ?? [])
      .filter(
        (item) =>
          (this.view === "inbox" ||
            this.view === "activity" ||
            item.kind === this.view) &&
          (!this.repositories.length ||
            this.repositories.includes(item.repository)) &&
          (!this.statuses.length || this.statuses.includes(item.status)) &&
          (!query ||
            [item.title, item.repository, item.category, ...item.reasons]
              .join(" ")
              .toLowerCase()
              .includes(query)),
      )
      .toSorted(
        (a, b) =>
          priority[a.status] - priority[b.status] || a.id.localeCompare(b.id),
      );
  }
  get counts() {
    const items = this.snapshot?.items ?? [];
    return {
      total: items.length,
      approvals: items.filter((i) => i.status === "approval-wait").length,
      failures: items.filter((i) => i.status === "failed").length,
      reviews: items.filter(
        (i) => i.status === "review-needed" || i.status === "draft",
      ).length,
    };
  }
  get unavailable() {
    return (
      this.snapshot?.repositories.filter((r) => !r.available && !r.loading) ??
      []
    );
  }
  async connect(): Promise<void> {
    if (!this.#disposed) {
      this.connected = true;
      await this.refresh();
    }
  }
  disconnect(): void {
    if (this.commands.busy) return;
    ++this.#readSequence;
    ++this.#detailSequence;
    this.#readAbort?.abort();
    this.#detailAbort?.abort();
    this.connected = false;
    this.snapshot = null;
    this.detail = null;
    this.selectedId = null;
    this.phase = "idle";
    this.error = null;
    this.detailError = null;
    this.detailLoading = false;
    this.commands.cancel();
    this.commands.receipts = [];
  }
  async refresh(force = false): Promise<void> {
    if (this.#disposed || !this.connected) return;
    const generation = ++this.#readSequence;
    this.#readAbort?.abort();
    this.#readAbort = new AbortController();
    this.phase = this.snapshot ? "refreshing" : "loading";
    this.error = null;
    try {
      const snapshot = await this.#read.readSnapshot(this.#readAbort.signal, {
        force,
        onProgress: (snapshot) => {
          if (
            !this.#disposed &&
            generation === this.#readSequence &&
            this.phase === "loading"
          )
            this.snapshot = snapshot;
        },
      });
      if (this.#disposed || generation !== this.#readSequence) return;
      this.snapshot = snapshot;
      this.phase = "ready";
      if (this.selectedId) {
        if (snapshot.items.some((i) => i.id === this.selectedId))
          await this.select(this.selectedId, force);
        else this.closeDetail();
      }
    } catch (error) {
      if (this.#disposed || generation !== this.#readSequence) return;
      this.error =
        error instanceof MaintenanceReadError
          ? error
          : new MaintenanceReadError(
              error instanceof Error ? error.message : "Refresh failed",
            );
      this.phase = "error";
    }
  }
  async select(id: string, fresh = false): Promise<void> {
    if (this.#disposed || !this.connected) return;
    if (!fresh && this.selectedId === id && this.detailLoading) return;
    const sequence = ++this.#detailSequence;
    this.#detailAbort?.abort();
    this.#detailAbort = new AbortController();
    if (this.selectedId !== id) this.detail = null;
    this.selectedId = id;
    this.detailLoading = true;
    this.detailError = null;
    try {
      const detail = await this.#read.readDetails(
        id,
        this.#detailAbort.signal,
        { fresh },
      );
      if (
        !this.#disposed &&
        sequence === this.#detailSequence &&
        detail.item.id === id
      )
        this.detail = detail;
    } catch (error) {
      if (!this.#disposed && sequence === this.#detailSequence)
        this.detailError =
          error instanceof Error ? error.message : "Details unavailable";
    } finally {
      if (!this.#disposed && sequence === this.#detailSequence)
        this.detailLoading = false;
    }
  }
  closeDetail(): void {
    ++this.#detailSequence;
    this.#detailAbort?.abort();
    this.selectedId = null;
    this.detail = null;
    this.detailError = null;
    this.detailLoading = false;
  }
  toggleRepository(repository: string): void {
    this.repositories = this.repositories.includes(repository)
      ? this.repositories.filter((value) => value !== repository)
      : [...this.repositories, repository];
  }
  resetFilters(): void {
    this.query = "";
    this.repositories = [];
    this.statuses = [];
  }
  dispose(): void {
    this.#disposed = true;
    ++this.#readSequence;
    ++this.#detailSequence;
    this.#readAbort?.abort();
    this.#detailAbort?.abort();
    this.commands.dispose();
  }
}
