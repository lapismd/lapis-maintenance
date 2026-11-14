import type {
  ReviewCommand,
  ReviewOverview,
} from "../maintenance/review/types";
import type { MaintenanceDetail } from "../maintenance/types";
/** Restore identity only. Cached presentation never supplies command authority. */
export function retainedCommandTarget(
  command: ReviewCommand,
  overview: ReviewOverview,
): MaintenanceDetail | undefined {
  const target = command.target;
  if (!target || target.kind === "dispatch") return;
  const repository = overview.repository,
    id = command.targetId || command.itemId;
  const number =
    target.kind === "pull-request"
      ? Number(
          id.match(
            new RegExp(
              `^pr:${repository.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:(\\d+)$`,
            ),
          )?.[1],
        )
      : undefined;
  if (
    target.kind === "pull-request"
      ? !number || !Number.isSafeInteger(number)
      : id !==
        (target.kind === "workflow"
          ? `run:${repository}:${target.runId}`
          : `deployment:${repository}:${target.runId}:${target.environmentId}`)
  )
    return;
  return {
    item: {
      id,
      repository,
      number,
      title: command.label,
      kind:
        target.kind === "pull-request"
          ? "pull-request"
          : target.kind === "workflow"
            ? "workflow"
            : "approval",
      status: "unavailable",
      category: "product",
      updatedAt: "",
      url: overview.url,
      reasons: ["Cached target identity; fresh command authority is required."],
      target,
      actions: [],
    },
    description: "",
    checks: [],
  };
}
