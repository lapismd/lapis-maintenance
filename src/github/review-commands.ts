import type {
  ReviewCommand,
  ReviewCommandPort,
} from "../maintenance/review/types";
import type { MaintenanceCommandPort } from "../maintenance/types";
import type { GithubReadPort } from "./read-port";
import type { GithubReviewPort } from "./review-port";
import type { MaintenanceController } from "../maintenance/controller.svelte";
import { retainedCommandTarget } from "./review-target";
export class GithubReviewCommands implements ReviewCommandPort {
  constructor(
    private reader: GithubReadPort,
    private resources: GithubReviewPort,
    private commands: MaintenanceCommandPort,
    private inbox: MaintenanceController,
  ) {}
  async execute(command: ReviewCommand, signal: AbortSignal) {
    const overview = await this.resources.read(
      command.itemId,
      "overview",
      signal,
    );
    const targetId = command.targetId || command.itemId;
    const detail =
      this.reader.seed(targetId) ?? retainedCommandTarget(command, overview);
    if (!detail || overview.sha !== command.sha)
      return {
        status: "rejected" as const,
        message: "The displayed revision changed. Refresh before submitting.",
      };
    this.reader.remember(detail);
    const kind =
      (
        {
          "approve-workflow": "approve-run",
          "approve-environment": "approve-deployment",
          "reject-environment": "reject-deployment",
        } as const
      )[command.kind as "approve-workflow"] ?? command.kind;
    const target = command.target ?? detail.item.target;
    const request = {
      requestId: command.requestId,
      itemId: detail.item.id,
      repository: detail.item.repository,
      target: { ...target, sha: command.sha },
      kind,
      inputs: { body: command.comment, mergeMethod: command.mergeMethod },
    } as import("../maintenance/types").MaintenanceCommand;
    const result = await this.commands.execute(request, signal);
    if (!signal.aborted)
      this.inbox.commands.receipts = [
        ...this.inbox.commands.receipts,
        { ...result, command: request },
      ];
    if (!signal.aborted && result.status !== "uncertain")
      await this.inbox.refreshAffected(request);
    return result;
  }
}
