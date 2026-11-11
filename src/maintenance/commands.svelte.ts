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
  receipts = $state.raw<ActionReceipt[]>([]);
  busy = $state(false);
  #disposed = false;
  #sequence = 0;
  #read: MaintenanceReadPort;
  #write: MaintenanceCommandPort;
  #refresh: (command: MaintenanceCommand) => Promise<void>;
  #validation?: AbortController;
  constructor(
    read: MaintenanceReadPort,
    write: MaintenanceCommandPort,
    refresh: (command: MaintenanceCommand) => Promise<void>,
  ) {
    this.#read = read;
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
    if (!this.busy) this.confirmation = null;
  }
  async confirm(inputs: CommandInputs = {}): Promise<void> {
    if (this.#disposed || this.busy || !this.confirmation) return;
    const command = {
      ...this.confirmation.command,
      inputs: { ...this.confirmation.command.inputs, ...inputs },
    };
    this.busy = true;
    this.#validation = new AbortController();
    try {
      const fresh = await this.#read.readDetails(
        command.itemId,
        this.#validation.signal,
        { fresh: true },
      );
      if (this.#disposed) return;
      if (
        fresh.item.repository !== command.repository ||
        targetKey(fresh.item.target) !== targetKey(command.target) ||
        !fresh.item.actions.some((a) => a.kind === command.kind && a.available)
      ) {
        this.#record(command, {
          status: "rejected",
          message:
            "Target or permissions changed. Refresh and review before confirming again.",
        });
        this.confirmation = null;
        await this.#refresh(command);
        return;
      }
      this.confirmation = null;
      let result;
      try {
        result = await this.#write.execute(command);
      } catch {
        result = {
          status: "uncertain" as const,
          message:
            "The outcome is unknown. Inspect GitHub before requesting this action again.",
        };
      }
      if (this.#disposed) return;
      this.#record(command, result);
      await this.#refresh(command);
    } catch (error) {
      if (!this.#disposed) {
        this.#record(command, {
          status: "rejected",
          message: `Could not validate the target: ${error instanceof Error ? error.message : "Read failed"}`,
        });
        this.confirmation = null;
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
    this.#validation?.abort();
    this.confirmation = null;
    this.busy = false;
  }
}
