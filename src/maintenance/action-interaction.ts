import type { ActionKind, CommandInputs } from "./types";
export type ActionInteraction = "direct" | "input" | "confirm-delete";
/** Exhaustive policy: new command kinds must explicitly choose their interaction. */
export const actionInteractions = {
  "mark-ready": "direct",
  "approve-pr": "direct",
  "request-changes": "input",
  comment: "input",
  "merge-pr": "direct",
  "enable-auto-merge": "direct",
  "disable-auto-merge": "direct",
  "rerun-failed": "direct",
  "cancel-run": "direct",
  "approve-run": "direct",
  "approve-deployment": "direct",
  "reject-deployment": "direct",
  "dispatch-workflow": "input",
} satisfies Record<ActionKind, ActionInteraction>;
export function interactionFor(
  kind: ActionKind,
): ActionInteraction | undefined {
  return Object.hasOwn(actionInteractions, kind)
    ? actionInteractions[kind]
    : undefined;
}
export function inputError(
  kind: ActionKind,
  inputs: CommandInputs,
): string | undefined {
  if (["comment", "request-changes"].includes(kind) && !inputs.body?.trim())
    return "Enter a comment before submitting.";
  if ((inputs.body?.length ?? 0) > 65_536)
    return "Comments must be at most 65,536 characters.";
  if (kind === "dispatch-workflow" && !inputs.ref?.trim())
    return "Choose an explicit branch or tag.";
}
