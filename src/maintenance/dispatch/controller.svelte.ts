import type {
  DispatchPort,
  DispatchWorkflow,
  DispatchRef,
  DispatchTarget,
} from "./types";
import type { MaintenanceCommand, CommandResult } from "../types";
import { validateInputs } from "./input-validation";
export class DispatchController {
  open = $state(false);
  repository = $state("");
  workflows = $state.raw<DispatchWorkflow[]>([]);
  refs = $state.raw<DispatchRef[]>([]);
  workflowId = $state("");
  ref = $state("");
  target = $state.raw<DispatchTarget | null>(null);
  values = $state<Record<string, string>>({});
  loading = $state(false);
  pending = $state(false);
  error = $state("");
  warnings = $state<string[]>([]);
  confirmation = $state.raw<MaintenanceCommand | null>(null);
  result = $state.raw<CommandResult | null>(null);
  #request?: AbortController;
  #command?: AbortController;
  #generation = 0;
  #disposed = false;
  constructor(private port: DispatchPort) {}
  async show(repository: string) {
    if (this.#disposed || this.pending) return;
    this.open = true;
    this.repository = repository;
    this.workflowId = "";
    this.ref = "";
    this.target = null;
    this.confirmation = null;
    this.result = null;
    const generation = ++this.#generation;
    this.#request?.abort();
    const request = (this.#request = new AbortController());
    this.loading = true;
    this.error = "";
    this.workflows = [];
    this.refs = [];
    try {
      const data = await this.port.discover(repository, request.signal);
      if (!this.#current(generation, request)) return;
      this.workflows = data.workflows;
      this.refs = data.refs;
      this.warnings = data.warnings;
    } catch (error) {
      if (this.#current(generation, request))
        this.error =
          error instanceof Error
            ? error.message
            : "Could not discover workflows.";
    } finally {
      if (this.#current(generation, request)) this.loading = false;
    }
  }
  async select(workflowId = this.workflowId, ref = this.ref) {
    if (this.#disposed || this.pending) return;
    this.workflowId = workflowId;
    this.ref = ref;
    this.target = null;
    this.confirmation = null;
    this.result = null;
    this.error = "";
    const generation = ++this.#generation;
    this.#request?.abort();
    const workflow = this.workflows.find((w) => String(w.id) === workflowId),
      reference = this.refs.find((r) => r.ref === ref);
    if (!workflow || !reference) {
      this.loading = false;
      return;
    }
    const request = (this.#request = new AbortController());
    this.loading = true;
    try {
      const target = await this.port.target(
        this.repository,
        workflow,
        reference,
        request.signal,
      );
      if (!this.#current(generation, request)) return;
      this.target = target;
      this.values = Object.fromEntries(
        target.inputs.map((i) => [
          i.name,
          i.default ?? (i.type === "boolean" ? "false" : ""),
        ]),
      );
    } catch (error) {
      if (this.#current(generation, request))
        this.error =
          error instanceof Error ? error.message : "Could not load this ref.";
    } finally {
      if (this.#current(generation, request)) this.loading = false;
    }
  }
  prepare() {
    const target = this.target;
    if (
      !target ||
      this.pending ||
      this.loading ||
      this.result ||
      this.#disposed
    )
      return;
    try {
      const inputs = validateInputs(
        target.inputs,
        this.values,
        target.environments,
      );
      this.confirmation = {
        requestId: `dispatch-${crypto.randomUUID()}`,
        itemId: `dispatch:${this.repository}:${target.workflow.id}`,
        repository: this.repository,
        kind: "dispatch-workflow",
        target: {
          kind: "dispatch",
          sha: target.ref.sha,
          workflowId: target.workflow.id,
          ref: target.ref.ref,
          definitionSha: target.definitionSha,
          defaultDefinitionSha: target.defaultDefinitionSha,
          path: target.workflow.path,
          name: target.workflow.name,
          url: target.workflow.url,
        },
        inputs: { ref: target.ref.ref, workflowInputs: inputs },
      };
      this.error = "";
    } catch (error) {
      this.error =
        error instanceof Error ? error.message : "Invalid workflow inputs.";
    }
  }
  async confirm() {
    const command = this.confirmation;
    if (!command || this.pending || this.#disposed) return;
    this.pending = true;
    const request = (this.#command = new AbortController());
    try {
      const result = await this.port.execute(command, request.signal);
      if (!this.#disposed) this.result = result;
    } catch {
      if (!this.#disposed)
        this.result = {
          status: "uncertain",
          message:
            "The dispatch response was interrupted. Inspect GitHub; do not resubmit this operation.",
        };
    } finally {
      this.confirmation = null;
      this.pending = false;
    }
  }
  cancel() {
    if (!this.pending) this.confirmation = null;
  }
  close() {
    if (this.pending) return;
    this.open = false;
    this.#generation++;
    this.#request?.abort();
  }
  dispose() {
    this.#disposed = true;
    this.#request?.abort();
    this.#command?.abort();
  }
  #current(generation: number, request: AbortController) {
    return (
      !this.#disposed &&
      !request.signal.aborted &&
      generation === this.#generation
    );
  }
}
