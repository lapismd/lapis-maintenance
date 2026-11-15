import {
  targetKey,
  type CommandResult,
  type ActionKind,
  type ActionReceipt,
  type CommandInputs,
  type MaintenanceCommand,
  type MaintenanceCommandPort,
  type MaintenanceItem,
  type MaintenanceReadPort,
} from "./types";

/** Explicit commands are separate from read/selection state. Never replay unknown effects. */
export class MaintenanceCommands {
  confirmation = $state.raw<{
    command: MaintenanceCommand;
    label: string;
  } | null>(null);
  batchConfirmation = $state.raw<{
    label: string;
    commands: MaintenanceCommand[];
  } | null>(null);
  receipts = $state.raw<ActionReceipt[]>([]);
  busy = $state(false);
  #disposed = false;
  #sequence = 0;
  #attempt?: AbortController;
  #write: MaintenanceCommandPort;
  #refresh: (command: MaintenanceCommand) => Promise<void>;
  constructor(
    _read: MaintenanceReadPort,
    write: MaintenanceCommandPort,
    refresh: (command: MaintenanceCommand) => Promise<void>,
  ) {
    this.#write = write;
    this.#refresh = refresh;
  }
  blocked(item: MaintenanceItem, kind: ActionKind): boolean {
    return this.receipts.some(
      (r) =>
        r.status === "uncertain" &&
        r.command.itemId === item.id &&
        r.command.kind === kind &&
        targetKey(r.command.target) === targetKey(item.target),
    );
  }
  prepare(
    item: MaintenanceItem,
    kind: ActionKind,
    inputs: CommandInputs = {},
  ): void {
    const capability = item.actions.find((a) => a.kind === kind && a.available);
    if (this.#disposed || this.busy || !capability || this.blocked(item, kind))
      return;
    this.batchConfirmation = null;
    this.confirmation = {
      label: capability.label,
      command: {
        requestId: `maintenance-${++this.#sequence}`,
        itemId: item.id,
        repository: item.repository,
        target: structuredClone(item.target),
        kind,
        inputs: structuredClone(inputs),
      },
    };
  }
  cancel(): void {
    if (!this.busy) {
      this.confirmation = null;
      this.batchConfirmation = null;
    }
  }
  async confirm(inputs: CommandInputs = {}): Promise<void> {
    if (this.#disposed || this.busy || !this.confirmation) return;
    const command = {
      ...this.confirmation.command,
      inputs: { ...this.confirmation.command.inputs, ...inputs },
    };
    this.busy = true;
    this.confirmation = null;
    this.#attempt = new AbortController();
    try {
      let result: CommandResult;
      try {
        result = await this.#write.execute(command, this.#attempt.signal);
      } catch {
        result = {
          status: "uncertain",
          message:
            "The outcome is unknown. Inspect GitHub before requesting this action again.",
        };
      }
      if (this.#disposed) return;
      this.#record(command, result);
      // A refresh failure cannot change the already recorded remote outcome.
      await this.#refresh(command).catch(() => {});
    } finally {
      if (!this.#disposed) this.busy = false;
    }
  }
  prepareBatch(items: MaintenanceItem[], kind: ActionKind): void {
    if (
      this.#disposed ||
      this.busy ||
      !["rerun-failed", "approve-run", "approve-deployment"].includes(kind)
    )
      return;
    const commands: MaintenanceCommand[] = [];
    const seen = new Set<string>();
    for (const item of items) {
      if (seen.has(item.id) || this.blocked(item, kind)) continue;
      seen.add(item.id);
      const capability = item.actions.find(
        (a) => a.kind === kind && a.available,
      );
      if (!capability) continue;
      commands.push({
        requestId: `maintenance-batch-${++this.#sequence}`,
        itemId: item.id,
        repository: item.repository,
        target: structuredClone(item.target),
        kind,
        inputs: {},
      });
    }
    this.confirmation = null;
    this.batchConfirmation = commands.length ? { label: kind, commands } : null;
  }
  async confirmBatch(inputs: CommandInputs = {}): Promise<void> {
    if (this.#disposed || this.busy || !this.batchConfirmation) return;
    const commands = this.batchConfirmation.commands.map((command) => ({
      ...command,
      inputs: { ...command.inputs, ...structuredClone(inputs) },
    }));
    this.batchConfirmation = null;
    this.busy = true;
    this.#attempt = new AbortController();
    try {
      for (const command of commands) {
        if (this.#disposed || this.#attempt.signal.aborted) break;
        let result: CommandResult;
        try {
          result = await this.#write.execute(command, this.#attempt.signal);
        } catch {
          result = {
            status: "uncertain",
            message:
              "Outcome unknown. Inspect GitHub; this target will not be replayed.",
          };
        }
        if (this.#disposed) break;
        this.#record(command, result);
        await this.#refresh(command).catch(() => {});
      }
    } finally {
      if (!this.#disposed) this.busy = false;
    }
  }
  #record(command: MaintenanceCommand, result: CommandResult): void {
    this.receipts = [...this.receipts, { ...result, command }];
  }
  dispose(): void {
    this.#disposed = true;
    this.#attempt?.abort();
    this.batchConfirmation = null;
    this.confirmation = null;
    this.busy = false;
  }
}
