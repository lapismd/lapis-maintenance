import { interactionFor, inputError } from "../action-interaction";
import {
  actionKindForReview,
  reviewCommand,
  reviewCommandKey,
} from "./command";
import { canPrepare } from "./prepare";
import type { ReviewController } from "./controller.svelte";
import type { ReviewAction, ReviewCommand, ReviewCommandPort } from "./types";
import type { CommandResult } from "../types";
/** One captured target per activation; required-input drafts submit only once. */
export class ReviewCommands {
  draft = $state.raw<ReviewCommand | null>(null);
  pending = $state(false);
  active = $state.raw<ReviewCommand | null>(null);
  validationError = $state("");
  inputResult = $state.raw<CommandResult | null>(null);
  receipt = $state.raw<{
    itemId: string;
    requestId: string;
    label: string;
    result: CommandResult;
  } | null>(null);
  #disposed = false;
  #command?: AbortController;
  #uncertain = new Set<string>();
  constructor(
    private host: ReviewController,
    private write: ReviewCommandPort,
  ) {}
  async invoke(
    kind: ReviewAction,
    targetId: string,
    label: string,
    options: { mergeMethod?: ReviewCommand["mergeMethod"] } = {},
  ) {
    if (this.#disposed || this.pending || !this.host.overview) return;
    const approval = this.host.resources.approvals.data?.find(
      (item) => item.id === targetId,
    );
    const interaction = interactionFor(actionKindForReview(kind));
    if (
      !interaction ||
      !canPrepare(
        kind,
        targetId === this.host.pullRequest?.id
          ? this.host.pullRequest
          : this.host.overview,
        this.host.resources.approvals.data,
        targetId,
        this.host.canApprove,
        this.host.canMerge,
        this.host.resources,
      )
    )
      return;
    const command = reviewCommand(
      this.host.overview,
      this.host.pullRequest,
      approval,
      kind,
      targetId,
      label,
      options,
    );
    if (this.#uncertain.has(reviewCommandKey(command))) return;
    this.inputResult = null;
    this.validationError = "";
    if (interaction !== "direct") {
      this.draft = command;
      return;
    }
    this.draft = null;
    await this.#execute(command);
  }
  cancel() {
    if (!this.pending) {
      this.draft = null;
      this.inputResult = null;
      this.validationError = "";
    }
  }
  async submitInput(comment = "") {
    const command = this.draft;
    if (
      this.#disposed ||
      this.pending ||
      !command ||
      this.inputResult?.status === "uncertain"
    )
      return;
    const error = inputError(actionKindForReview(command.kind), {
      body: comment,
    });
    this.validationError = error ?? "";
    if (error) {
      this.inputResult = { status: "rejected", message: error };
      return;
    }
    await this.#execute(
      { ...command, requestId: `review-${crypto.randomUUID()}`, comment },
      command.requestId,
    );
  }
  async #execute(command: ReviewCommand, draftId?: string) {
    this.pending = true;
    this.active = command;
    this.#command = new AbortController();
    try {
      let result: CommandResult;
      try {
        result = await this.write.execute(command, this.#command.signal);
      } catch {
        result = {
          status: "uncertain",
          message:
            "The response was interrupted. Inspect the target before retrying.",
        };
      }
      if (this.#disposed) return;
      if (result.status === "uncertain")
        this.#uncertain.add(reviewCommandKey(command));
      this.receipt = {
        itemId: command.itemId,
        requestId: command.requestId,
        label: command.label,
        result,
      };
      if (this.draft?.requestId === draftId && !!draftId) {
        this.inputResult = result;
        if (["completed", "accepted"].includes(result.status))
          this.draft = null;
      }
      if (
        this.host.selectedId === command.itemId &&
        result.status !== "uncertain"
      )
        await this.host.refresh();
    } finally {
      this.pending = false;
      this.active = null;
    }
  }
  dispose() {
    this.#disposed = true;
    this.#command?.abort();
  }
}
