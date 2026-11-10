import type { ActionCapability, MaintenanceDetail } from "../maintenance/types";
import type { GithubPull, GithubRepository, GithubRun } from "./models";
export interface GithubAccess {
  login: string;
  repository: GithubRepository;
}
export const futureAction = (
  kind: ActionCapability["kind"],
  label: string,
): ActionCapability => ({
  kind,
  label,
  available: false,
  reason:
    "This action is not enabled yet; open the item on GitHub to take action.",
});
export const canPush = (access: GithubAccess) =>
  !!(
    access.repository.permissions?.push ||
    access.repository.permissions?.admin ||
    access.repository.permissions?.maintain
  );
const availableRepository = (access: GithubAccess) =>
  !access.repository.archived && !access.repository.disabled;
const capability = (
  kind: ActionCapability["kind"],
  label: string,
  available: boolean,
  reason: string,
): ActionCapability => ({
  kind,
  label,
  available,
  reason: available ? undefined : reason,
});
export function pullActions(
  pr: GithubPull,
  detail: MaintenanceDetail,
  access?: GithubAccess,
): ActionCapability[] {
  const kinds: [ActionCapability["kind"], string][] = pr.draft
    ? [["mark-ready", "Mark ready for review"]]
    : [
        ["approve-pr", "Approve PR"],
        ["request-changes", "Request changes"],
        ["comment", "Leave review comment"],
        ["merge-pr", "Merge PR"],
      ];
  if (!access) return kinds.map(([kind, label]) => futureAction(kind, label));
  const active = pr.state === "open" && availableRepository(access);
  const own = pr.user?.login?.toLowerCase() === access.login.toLowerCase();
  const eligible =
    active &&
    !pr.draft &&
    canPush(access) &&
    !detail.coverage?.length &&
    detail.checks.length > 0 &&
    detail.checks.every((check) => check.state === "passed") &&
    detail.item.status !== "blocked" &&
    pr.mergeable === true &&
    pr.mergeable_state === "clean" &&
    !!detail.mergeMethods?.length;
  return kinds.map(([kind, label]) => {
    if (
      kind === "approve-pr" &&
      (!detail.checks.length || detail.coverage?.length)
    )
      return capability(
        kind,
        label,
        false,
        "PR approval requires available current-revision checks. Approve any waiting workflow run first so CI can report its checks.",
      );
    if (kind === "merge-pr")
      return capability(
        kind,
        label,
        eligible,
        "Merge requires repository write access, an allowed merge method, complete successful checks and clean GitHub merge eligibility; holds and repository rules remain authoritative.",
      );
    if (kind === "mark-ready")
      return capability(
        kind,
        label,
        active && !!pr.node_id && (own || canPush(access)),
        "Only the author or a repository writer can mark this open draft ready.",
      );
    return capability(
      kind,
      label,
      active && (kind === "comment" || !own),
      own && kind !== "comment"
        ? "GitHub does not allow approving or requesting changes on your own PR."
        : "This pull request is no longer open or its repository is unavailable.",
    );
  });
}
export function workflowAction(
  kind: "cancel-run" | "rerun-failed" | "approve-run",
  run: GithubRun,
  access?: GithubAccess,
): ActionCapability {
  const label =
    kind === "cancel-run"
      ? "Cancel workflow"
      : kind === "approve-run"
        ? "Approve workflow run"
        : "Rerun failed jobs";
  if (!access) return futureAction(kind, label);
  const valid =
    kind === "approve-run"
      ? run.conclusion === "action_required"
      : kind === "cancel-run"
        ? ["queued", "in_progress", "waiting", "pending", "requested"].includes(
            run.status,
          )
        : run.status === "completed" &&
          [
            "failure",
            "timed_out",
            "action_required",
            "startup_failure",
          ].includes(run.conclusion ?? "");
  return capability(
    kind,
    label,
    valid && availableRepository(access) && canPush(access),
    "This operation requires repository write access and an eligible current workflow attempt; the token also needs Actions write permission.",
  );
}
export function mergeMethods(
  repository: GithubRepository,
): NonNullable<MaintenanceDetail["mergeMethods"]> {
  return [
    ...(repository.allow_squash_merge ? ["squash" as const] : []),
    ...(repository.allow_merge_commit ? ["merge" as const] : []),
    ...(repository.allow_rebase_merge ? ["rebase" as const] : []),
  ];
}
