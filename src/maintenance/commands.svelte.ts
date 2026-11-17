import { interactionFor, inputError } from "./action-interaction";
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

/** Only explicit activation submits. Input forms never authorize a different target. */
export class MaintenanceCommands {
  draft = $state.raw<{ command: MaintenanceCommand; label: string } | null>(
    null,
  );
  validationError = $state("");
  inputResult = $state.raw<CommandResult | null>(null);
  active = $state.raw<MaintenanceCommand | null>(null);
  receipts = $state.raw<ActionReceipt[]>([]);
  busy = $state(false);
  #disposed = false;
  #sequence = 0;
  #attempt?: AbortController;
  constructor(
    _read: MaintenanceReadPort,
    private write: MaintenanceCommandPort,
    private refresh: (command: MaintenanceCommand) => Promise<void>,
  ) {}
  blocked(item: MaintenanceItem, kind: ActionKind): boolean {
    return this.receipts.some(
      (r) =>
        r.status === "uncertain" &&
        r.command.itemId === item.id &&
        r.command.kind === kind &&
        targetKey(r.command.target) === targetKey(item.target),
    );
  }
  #capture(
    item: MaintenanceItem,
    kind: ActionKind,
    inputs: CommandInputs,
  ): MaintenanceCommand | undefined {
    if (
      this.#disposed ||
      this.busy ||
      !interactionFor(kind) ||
      this.blocked(item, kind) ||
      !item.actions.some((a) => a.kind === kind && a.available)
    )
      return;
    return {
      requestId: `maintenance-${++this.#sequence}`,
      itemId: item.id,
      repository: item.repository,
      target: structuredClone(item.target),
      kind,
      inputs: structuredClone(inputs),
    };
  }
  async invoke(
    item: MaintenanceItem,
    kind: ActionKind,
    inputs: CommandInputs = {},
  ) {
    const command = this.#capture(item, kind, inputs);
    if (!command) return;
    this.inputResult = null;
    this.validationError = "";
    if (interactionFor(kind) !== "direct") {
      this.draft = {
        command,
        label: item.actions.find((a) => a.kind === kind)!.label,
      };
      return;
    }
    this.draft = null;
    await this.#execute([command]);
  }
  cancel() {
    if (!this.busy) {
      this.draft = null;
      this.inputResult = null;
      this.validationError = "";
    }
  }
  async submitInput(inputs: CommandInputs = {}) {
    const draft = this.draft;
    if (
      this.#disposed ||
      this.busy ||
      !draft ||
      this.inputResult?.status === "uncertain"
    )
      return;
    const command = {
      ...draft.command,
      requestId: `maintenance-${crypto.randomUUID()}`,
      inputs: { ...draft.command.inputs, ...structuredClone(inputs) },
    };
    const error = inputError(command.kind, command.inputs);
    this.validationError = error ?? "";
    if (error) {
      this.inputResult = { status: "rejected", message: error };
      return;
    }
    await this.#execute([command], draft.command.requestId);
  }
  async invokeBatch(items: MaintenanceItem[], kind: ActionKind) {
    if (
      this.#disposed ||
      this.busy ||
      !["rerun-failed", "approve-run", "approve-deployment"].includes(kind)
    )
      return;
    const commands: MaintenanceCommand[] = [],
      seen = new Set<string>();
    for (const item of items) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      const command = this.#capture(item, kind, {});
      if (command) commands.push(command);
    }
    if (!commands.length) return;
    this.draft = null;
    await this.#execute(commands);
  }
  async #execute(commands: MaintenanceCommand[], draftId?: string) {
    this.busy = true;
    const request = (this.#attempt = new AbortController());
    try {
      for (const command of commands) {
        if (this.#disposed || request.signal.aborted) break;
        this.active = command;
        let result: CommandResult;
        try {
          result = await this.write.execute(command, request.signal);
        } catch {
          result = {
            status: "uncertain",
            message:
              "Outcome unknown. Inspect GitHub; this target will not be replayed.",
          };
        }
        if (this.#disposed) break;
        this.receipts = [...this.receipts, { ...result, command }];
        if (this.draft?.command.requestId === draftId && !!draftId) {
          this.inputResult = result;
          if (["completed", "accepted"].includes(result.status))
            this.draft = null;
        }
        await this.refresh(command).catch(() => {});
      }
    } finally {
      if (!this.#disposed) {
        this.busy = false;
        this.active = null;
      }
    }
  }
  dispose() {
    this.#disposed = true;
    this.#attempt?.abort();
    this.draft = null;
    this.busy = false;
    this.active = null;
  }
}
