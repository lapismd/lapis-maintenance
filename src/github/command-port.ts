import {
  targetKey,
  type MaintenanceCommand,
  type MaintenanceCommandPort,
  type MaintenanceReadPort,
  type CommandResult,
} from "../maintenance/types";
import { GithubWriteError, type GithubWriteTransport } from "./write-transport";
import type { GithubTransport } from "./transport";
import { validRepository, type GithubPull } from "./models";

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
  constructor(
    private client: GithubTransport,
    private writer: GithubWriteTransport,
    private reader: MaintenanceReadPort,
  ) {}
  execute(command: MaintenanceCommand): Promise<CommandResult> {
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
    const pending = this.#execute(command)
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
  async #execute(command: MaintenanceCommand): Promise<CommandResult> {
    let submitted = false;
    try {
      if (
        !validRepository(command.repository) ||
        !/^[0-9a-f]{40,64}$/i.test(command.target.sha)
      )
        return rejected("The command has an invalid repository or revision.");
      if (
        ![
          "mark-ready",
          "approve-pr",
          "request-changes",
          "comment",
          "merge-pr",
          "rerun-failed",
          "cancel-run",
          "approve-run",
        ].includes(command.kind)
      )
        return rejected("This release action is not enabled yet.");
      const detail = await this.reader.readDetails(
        command.itemId,
        new AbortController().signal,
        { fresh: true },
      );
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
      const root = `/repos/${command.repository}`;
      const url = detail.item.url;
      if (command.target.kind === "workflow") {
        const target = command.target;
        if (
          command.itemId !== `run:${command.repository}:${target.runId}` ||
          !Number.isSafeInteger(target.runId) ||
          !Number.isSafeInteger(target.attempt) ||
          target.attempt < 1 ||
          !["rerun-failed", "cancel-run", "approve-run"].includes(command.kind)
        )
          return rejected("Invalid workflow command target.");
        submitted = true;
        await this.writer.submit(
          `${root}/actions/runs/${target.runId}/${command.kind === "rerun-failed" ? "rerun-failed-jobs" : command.kind === "approve-run" ? "approve" : "cancel"}`,
          "POST",
        );
        return {
          status: "accepted",
          message:
            command.kind === "approve-run"
              ? "GitHub accepted workflow approval. CI is not yet complete."
              : command.kind === "rerun-failed"
                ? "GitHub accepted the rerun request. The new attempt is not yet complete."
                : "GitHub accepted cancellation. The workflow may take time to stop.",
          url,
        };
      }
      if (
        command.target.kind !== "pull-request" ||
        !detail.item.number ||
        !Number.isSafeInteger(detail.item.number) ||
        command.itemId !== `pr:${command.repository}:${detail.item.number}`
      )
        return rejected("Invalid PR command target.");
      const pull = `${root}/pulls/${detail.item.number}`;
      if (command.kind === "merge-pr") {
        const method = command.inputs.mergeMethod;
        if (!method || !detail.mergeMethods?.includes(method))
          return rejected("Choose an allowed repository merge method.");
        submitted = true;
        const result = await this.writer.submit(`${pull}/merge`, "PUT", {
          sha: command.target.sha,
          merge_method: method,
        });
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
        const pr = await this.client.read<GithubPull>(
          pull,
          new AbortController().signal,
          { fresh: true },
        );
        if (
          pr.state !== "open" ||
          !pr.draft ||
          pr.head.sha !== command.target.sha ||
          !pr.node_id
        )
          return rejected(
            "The draft or revision changed. Refresh and review it again.",
          );
        submitted = true;
        const result = await this.writer.submit("/graphql", "POST", {
          query:
            "mutation Ready($id: ID!) { markPullRequestReadyForReview(input: {pullRequestId: $id}) { pullRequest { isDraft headRefOid } } }",
          variables: { id: pr.node_id },
        });
        const body = result.body as
          | {
              data?: {
                markPullRequestReadyForReview?: {
                  pullRequest?: { isDraft: boolean; headRefOid: string };
                };
              };
              errors?: { type?: string; extensions?: { code?: string } }[];
            }
          | undefined;
        const updated = body?.data?.markPullRequestReadyForReview?.pullRequest;
        if (
          !updated &&
          body?.errors?.length &&
          body.errors.every((error) =>
            [
              "FORBIDDEN",
              "UNAUTHORIZED",
              "NOT_FOUND",
              "INSUFFICIENT_SCOPES",
              "GRAPHQL_VALIDATION_FAILED",
            ].includes(error.type ?? error.extensions?.code ?? ""),
          )
        )
          return rejected(
            "GitHub rejected readiness. Check token permissions and the current PR state.",
          );
        if (
          body?.errors?.length ||
          !updated ||
          updated.headRefOid !== command.target.sha
        )
          return uncertain(
            "Readiness was not confirmed for the displayed revision. Inspect GitHub; this action will not be replayed.",
          );
        return updated.isDraft
          ? rejected("GitHub still reports this PR as a draft.")
          : {
              status: "completed",
              message: "The PR is ready for review.",
              url,
            };
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
      const result = await this.writer.submit(`${pull}/reviews`, "POST", {
        event,
        commit_id: command.target.sha,
        ...(body ? { body } : {}),
      });
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
            "Could not revalidate the target. Refresh before trying again.",
          );
    }
  }
}
