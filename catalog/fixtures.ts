import type {
  ActionCapability,
  ActionKind,
  MaintenanceDetail,
  MaintenanceItem,
  MaintenanceSnapshot,
  Target,
} from "../src/maintenance/types";
export const fixtureTime = "2026-11-10T09:45:00Z";
const actionLabels: Record<ActionKind, string> = {
  "mark-ready": "Mark ready for review",
  "approve-pr": "Approve PR",
  "request-changes": "Request changes",
  comment: "Leave review comment",
  "merge-pr": "Merge PR",
  "rerun-failed": "Rerun failed jobs",
  "cancel-run": "Cancel workflow",
  "approve-run": "Approve workflow run",
  "approve-deployment": "Approve deployment",
  "reject-deployment": "Reject deployment",
  "dispatch-workflow": "Start release workflow",
};
const capabilities = (...kinds: ActionKind[]): ActionCapability[] =>
  kinds.map((kind) => ({ kind, label: actionLabels[kind], available: true }));
function item(
  id: string,
  repository: string,
  title: string,
  kind: MaintenanceItem["kind"],
  status: MaintenanceItem["status"],
  category: MaintenanceItem["category"],
  reasons: string[],
  actions: ActionCapability[],
  number = 12,
): MaintenanceItem {
  const sha = Array.from(id)
    .map((c) => c.charCodeAt(0).toString(16))
    .join("")
    .padEnd(40, "a")
    .slice(0, 40);
  const target: Target =
    kind === "pull-request"
      ? { kind, sha }
      : kind === "approval"
        ? { kind: "deployment", sha, runId: 41000 + number, environmentId: 8 }
        : { kind: "workflow", sha, runId: 41000 + number, attempt: 2 };
  return {
    id,
    repository,
    title,
    kind,
    status,
    category,
    reasons,
    actions,
    number,
    updatedAt: "2026-11-10T07:30:00Z",
    url: `https://github.com/${repository}/${kind === "pull-request" ? "pull/" + number : "actions/runs/" + (41000 + number)}`,
    target,
  };
}
/** Invented, representative review fixtures; no claim about live GitHub state. */
export function snapshotFixture(): MaintenanceSnapshot {
  const items = [
    item(
      "registry",
      "lapismd/plugin-registry",
      "Publish approved registry updates",
      "pull-request",
      "review-needed",
      "registry",
      [
        "Three verified submissions are queued in this combined publication PR.",
      ],
      capabilities("approve-pr", "merge-pr"),
      63,
    ),
    item(
      "approval",
      "lapismd/lapis-plugin-notebook",
      "Notebook release · production approval",
      "approval",
      "approval-wait",
      "release",
      ["The verified candidate is waiting for an authorised reviewer."],
      capabilities("approve-deployment", "reject-deployment"),
      25,
    ),
    item(
      "failure",
      "lapismd/lapis-desktop",
      "Desktop CI · package acceptance",
      "workflow",
      "failed",
      "product",
      ["The latest attempt failed its package acceptance job."],
      capabilities("rerun-failed"),
      31,
    ),
    item(
      "compatibility",
      "lapismd/lapis-notes",
      "Review Design Core 0.12 compatibility",
      "pull-request",
      "draft",
      "compatibility",
      ["A pre-1.0 minor upgrade requires manual compatibility review."],
      capabilities("mark-ready", "comment"),
      74,
    ),
    item(
      "version",
      "lapismd/lapis-plugins",
      "Version first-party plugin packages",
      "pull-request",
      "review-needed",
      "versioning",
      ["Release notes and version bumps are ready for a maintainer."],
      capabilities("approve-pr", "request-changes", "comment", "merge-pr"),
      71,
    ),
    item(
      "hold",
      "lapismd/lapis-desktop",
      "Desktop dependency cohort held",
      "workflow",
      "blocked",
      "dependency",
      [
        "Profile/API 0.2.3 remains pinned until archive projection is qualified.",
      ],
      [
        {
          kind: "dispatch-workflow",
          label: "Reconcile dependencies",
          available: false,
          reason: "Dependency writes are explicitly held for this repository.",
        },
      ],
      32,
    ),
    item(
      "dependency",
      "lapismd/design-core",
      "Refresh compatible first-party dependencies",
      "pull-request",
      "passed",
      "dependency",
      ["Reported checks passed; repository merge rules remain authoritative."],
      capabilities("approve-pr", "merge-pr"),
      19,
    ),
    item(
      "running",
      "lapismd/mira-mde",
      "Mira CI · Storybook interactions",
      "workflow",
      "running",
      "product",
      ["Functional and accessibility checks are running."],
      capabilities("cancel-run"),
      30,
    ),
    item(
      "cancelled",
      "lapismd/lapis-notes",
      "Previous CI attempt cancelled",
      "workflow",
      "cancelled",
      "product",
      ["Cancelled is distinct from failed; inspect the run before retrying."],
      [],
      33,
    ),
    item(
      "release",
      "lapismd/lapis-plugin-tasks",
      "Tasks release · manual dispatch",
      "workflow",
      "review-needed",
      "release",
      ["A manual workflow is available for the reviewed release candidate."],
      capabilities("dispatch-workflow"),
      28,
    ),
  ];
  for (const record of items) {
    if (record.status === "review-needed")
      record.actions = record.actions.map((action) =>
        action.kind === "merge-pr"
          ? {
              ...action,
              available: false,
              reason: "Required maintainer approval is still pending.",
            }
          : action,
      );
  }
  return {
    items,
    fetchedAt: fixtureTime,
    repositories: [...new Set(items.map((i) => i.repository))].map(
      (repository) => ({ repository, available: true }),
    ),
  };
}
export function detailFixture(item: MaintenanceItem): MaintenanceDetail {
  return {
    item,
    description: item.reasons.join("\n\n"),
    mergeable: true,
    checks: [
      {
        name: "Types and contracts",
        state: "passed",
        description:
          "Type checking and specification validation passed for this revision.",
      },
      {
        name:
          item.kind === "workflow"
            ? "Package acceptance"
            : "Functional acceptance",
        state:
          item.status === "failed"
            ? "failed"
            : item.status === "running"
              ? "running"
              : "passed",
        description:
          item.status === "failed"
            ? "The packaged desktop smoke test could not start. Review the current workflow attempt before rerunning failed jobs."
            : item.status === "running"
              ? "Acceptance is running for this revision; a final result is not available yet."
              : "The functional acceptance suite completed successfully for this revision.",
      },
    ],
    review:
      item.status === "draft"
        ? "Compatibility review required before marking ready."
        : "Maintainer review required; no policies are bypassed.",
    workflow: item.kind !== "pull-request" ? "release.yml" : undefined,
    environment: item.kind === "approval" ? "npm-production" : undefined,
    ref: item.kind === "workflow" ? "main" : undefined,
  };
}
