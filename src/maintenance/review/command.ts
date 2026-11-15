import type { ActionKind } from "../types";
import type {
  ReviewAction,
  ReviewApproval,
  ReviewCommand,
  ReviewOverview,
} from "./types";
export const actionKindForReview = (kind: ReviewAction): ActionKind =>
  (
    ({
      "approve-workflow": "approve-run",
      "approve-environment": "approve-deployment",
      "reject-environment": "reject-deployment",
    }) as const
  )[kind as "approve-workflow"] ?? kind;
export function reviewCommand(
  overview: ReviewOverview,
  pull: ReviewOverview | undefined,
  approval: ReviewApproval | undefined,
  kind: ReviewAction,
  targetId: string,
  label: string,
  options: { mergeMethod?: ReviewCommand["mergeMethod"] },
): ReviewCommand {
  return {
    requestId: `review-${crypto.randomUUID()}`,
    repository: overview.repository,
    itemId: overview.id,
    targetId,
    target: structuredClone(
      approval?.target ??
        (targetId === pull?.id ? pull.target : overview.target),
    ),
    sha: approval?.sha ?? (targetId === pull?.id ? pull.sha : overview.sha),
    kind,
    label,
    runId: approval?.runId,
    attempt: approval?.attempt,
    environment: approval?.environment,
    mergeMethod:
      options.mergeMethod ??
      (["merge-pr", "enable-auto-merge"].includes(kind)
        ? (pull?.mergeMethods?.[0] ?? "squash")
        : undefined),
  };
}

/** Labels and merge-method changes cannot authorize replay of an unknown outcome. */
export function reviewCommandKey(command: ReviewCommand) {
  return JSON.stringify([
    command.repository,
    command.itemId,
    command.targetId,
    command.kind,
    command.sha,
    command.runId,
    command.attempt,
    command.environment,
  ]);
}
