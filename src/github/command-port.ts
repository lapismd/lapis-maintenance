import {
  targetKey,
  type MaintenanceCommand,
  type MaintenanceCommandPort,
  type MaintenanceReadPort,
  type MaintenanceDetail,
  type CommandResult,
} from "../maintenance/types";
import { GithubWriteError, type GithubWriteTransport } from "./write-transport";
import type { GithubTransport } from "./transport";
import { submitAutoMerge } from "./auto-merge-command";
import { submitReadiness } from "./readiness-command";
import { submitWorkflow } from "./workflow-commands";
import { submitDispatch } from "./dispatch-command";
import type { DispatchReads } from "./dispatch-reads";
import { validRepository } from "./models";

const rejected = (message: string): CommandResult => ({
  status: "rejected",
  message,
});
const uncertain = (message: string): CommandResult => ({
  status: "uncertain",
  message,
});
export class GithubCommandPort implements MaintenanceCommandPort {
  #requests = new Map<string, Promise<CommandResult>>();
  #uncertain = new Set<string>();
  #busy = false;
  dispatch?: DispatchReads;
  constructor(
    _client: GithubTransport,
    private writer: GithubWriteTransport,
    private reader: MaintenanceReadPort & {
      readCommandTarget?: (
        command: MaintenanceCommand,
        signal: AbortSignal,
      ) => Promise<MaintenanceDetail>;
    },
  ) {}
  execute(
    command: MaintenanceCommand,
    signal = new AbortController().signal,
  ): Promise<CommandResult> {
    const existing = this.#requests.get(command.requestId);
    if (existing) return existing;
    if (this.#busy)
      return Promise.resolve(rejected("Another action is still pending."));
    const key = `${command.itemId}:${command.kind}:${targetKey(command.target)}`;
    if (this.#uncertain.has(key))
      return Promise.resolve(
        rejected(
          "A previous result for this target is uncertain. Inspect GitHub before continuing.",
        ),
      );
    this.#busy = true;
    const pending = this.#execute(command, signal)
      .then((result) => {
        if (result.status === "uncertain") this.#uncertain.add(key);
        return result;
      })
      .finally(() => {
        this.#busy = false;
      });
    this.#requests.set(command.requestId, pending);
    return pending;
  }
  async #execute(
    command: MaintenanceCommand,
    signal: AbortSignal,
  ): Promise<CommandResult> {
    let submitted = false;
    try {
      if (
        !validRepository(command.repository) ||
        !/^[0-9a-f]{40,64}$/i.test(command.target.sha)
      )
        return rejected("The command has an invalid repository or revision.");
      if (command.kind === "dispatch-workflow" && this.dispatch) {
        // The dispatch preflight itself never writes. The writer marks uncertain network outcomes.
        return await submitDispatch(
          this.dispatch,
          this.writer,
          command,
          signal,
        );
      }
      if (
        ![
          "mark-ready",
          "approve-pr",
          "request-changes",
          "comment",
          "merge-pr",
          "enable-auto-merge",
          "disable-auto-merge",
          "rerun-failed",
          "cancel-run",
          "approve-run",
          "approve-deployment",
          "reject-deployment",
        ].includes(command.kind)
      )
        return rejected("This release action is not enabled yet.");
      const detail = this.reader.readCommandTarget
        ? await this.reader.readCommandTarget(command, signal)
        : await this.reader.readDetails(command.itemId, signal, {
            fresh: true,
          });
      if (
        detail.item.id !== command.itemId ||
        detail.item.repository !== command.repository ||
        targetKey(detail.item.target) !== targetKey(command.target) ||
        !detail.item.actions.some(
          (action) => action.kind === command.kind && action.available,
        )
      )
        return rejected(
          "Target or permissions changed. Refresh and review the action again.",
        );
      signal.throwIfAborted();
      const root = `/repos/${command.repository}`;
      const url = detail.item.url;
      if (
        command.target.kind === "workflow" ||
        command.target.kind === "deployment"
      ) {
        submitted = true;
        return await submitWorkflow(this.writer, command, detail, signal);
      }
      if (
        command.target.kind !== "pull-request" ||
        !detail.item.number ||
        !Number.isSafeInteger(detail.item.number) ||
        command.itemId !== `pr:${command.repository}:${detail.item.number}`
      )
        return rejected("Invalid PR command target.");
      const pull = `${root}/pulls/${detail.item.number}`;
      if (
        command.kind === "enable-auto-merge" ||
        command.kind === "disable-auto-merge"
      ) {
        submitted = true;
        return await submitAutoMerge(this.writer, command, detail, signal);
      }
      if (command.kind === "merge-pr") {
        const method = command.inputs.mergeMethod;
        if (!method || !detail.mergeMethods?.includes(method))
          return rejected("Choose an allowed repository merge method.");
        submitted = true;
        const result = await this.writer.submit(
          `${pull}/merge`,
          "PUT",
          {
            sha: command.target.sha,
            merge_method: method,
          },
          signal,
        );
        const body = result.body as { merged?: boolean } | undefined;
        return body?.merged === true
          ? {
              status: "completed",
              message: "GitHub merged the displayed PR revision.",
              url,
            }
          : body?.merged === false
            ? rejected(
                "GitHub did not merge the PR. Required reviews, checks, merge queues and repository rules remain authoritative.",
              )
            : uncertain(
                "GitHub did not confirm a merge result. Inspect the PR before continuing.",
              );
      }
      if (command.kind === "mark-ready") {
        submitted = true;
        return await submitReadiness(this.writer, detail, signal);
      }
      const event = {
        "approve-pr": "APPROVE",
        "request-changes": "REQUEST_CHANGES",
        comment: "COMMENT",
      }[command.kind as "approve-pr" | "request-changes" | "comment"];
      if (!event) return rejected("This action does not apply to a PR.");
      const body = command.inputs.body?.trim() ?? "";
      if ((event !== "APPROVE" && !body) || body.length > 65_536)
        return rejected("Enter a review comment of at most 65,536 characters.");
      submitted = true;
      const result = await this.writer.submit(
        `${pull}/reviews`,
        "POST",
        {
          event,
          commit_id: command.target.sha,
          ...(body ? { body } : {}),
        },
        signal,
      );
      const review = result.body as
        | { id?: number; state?: string; commit_id?: string }
        | undefined;
      if (
        !review?.id ||
        review.commit_id !== command.target.sha ||
        review.state !==
          {
            APPROVE: "APPROVED",
            REQUEST_CHANGES: "CHANGES_REQUESTED",
            COMMENT: "COMMENTED",
          }[event]
      )
        return uncertain(
          "GitHub did not confirm the review on the displayed revision. Inspect the PR; the review will not be replayed.",
        );
      return {
        status: "completed",
        message: "The review was submitted for the displayed PR revision.",
        url,
      };
    } catch (error) {
      if (error instanceof GithubWriteError)
        return {
          status: error.uncertain ? "uncertain" : "rejected",
          message: error.message,
        };
      return submitted
        ? uncertain(
            "The outcome is unknown. Inspect GitHub; this action will not be replayed.",
          )
        : rejected(
            error instanceof Error
              ? error.message
              : "Could not revalidate the target. Refresh before trying again.",
          );
    }
  }
}
