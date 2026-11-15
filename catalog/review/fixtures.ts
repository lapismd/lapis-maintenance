import { snapshotFixture } from "../fixtures";
import { reviewAvatars } from "./avatars";
import type {
  ReviewResources,
  ReviewOverview,
  ReviewApproval,
  ReviewEvent,
} from "../../src/maintenance/review/types";
export type ReviewScenario =
  | "auto-merge"
  | "merge-options"
  | "long-inspector"
  | "ready"
  | "merge-blocked"
  | "workflow-approval"
  | "environment-approval"
  | "eligibility-checking"
  | "reviewer-wait"
  | "failed-checks"
  | "permission-denied"
  | "loading"
  | "refreshing"
  | "empty"
  | "resource-error"
  | "stale"
  | "uncertain";
export function reviewSummaries(): ReviewOverview[] {
  return snapshotFixture().items.map((item) => ({
    id: item.id,
    kind: item.kind,
    repository: item.repository,
    number: item.number ?? 63,
    title: item.title,
    url: item.url,
    author: "lapis-automation[bot]",
    sha: item.target.sha,
    head:
      item.id === "compatibility"
        ? "renovate/design-core"
        : "changeset-release/main",
    base: "main",
    description:
      "Keep first-party packages moving together.\n\nThis update includes the reviewed package changes, release notes and registry metadata. Signing and publishing remain in their owning workflows.",
    labels: [item.category, "automation"],
    review: "Maintainer review required",
    draft: item.status === "draft",
    state: "open",
    actions: [
      { kind: "comment", label: "Leave review comment", available: true },
      { kind: "request-changes", label: "Request changes", available: true },
    ],
    canReview: true,
    canMerge: item.kind === "pull-request",
    additions: 128,
    deletions: 34,
  }));
}
const events = (pr: ReviewOverview): ReviewEvent[] => [
  {
    id: "opened",
    kind: "commit",
    actor: pr.author,
    avatarUrl: reviewAvatars.automation,
    title: "opened this pull request",
    body: "Updated package versions, changelogs and the registry lockfile.",
    time: "2 hours ago",
    url: pr.url,
  },
  {
    id: "checks",
    outcome: "success",
    kind: "comment",
    actor: "github-actions[bot]",
    avatarUrl: reviewAvatars.actions,
    title: "reported the current checks",
    body: "Types, unit tests and package acceptance passed for the displayed revision.",
    time: "1 hour ago",
    url: `${pr.url}/checks`,
  },
  {
    id: "review",
    kind: "review",
    actor: "stevejuma",
    avatarUrl: reviewAvatars.maintainer,
    title: "reviewed the release notes",
    body: "The dependency cohort looks good. Waiting for the final maintainer approval before merging.",
    time: "24 minutes ago",
    url: `${pr.url}#pullrequestreview-1001`,
  },
  {
    id: "deploy",
    kind: "deployment",
    actor: "github-actions[bot]",
    avatarUrl: reviewAvatars.actions,
    title: "requested an environment review",
    body: "The protected publication job is waiting for an eligible reviewer.",
    time: "10 minutes ago",
    url: `https://github.com/${pr.repository}/actions/runs/41025`,
  },
  {
    id: "commit-2",
    kind: "commit",
    actor: pr.author,
    title: "updated the lockfile",
    body: "Regenerated the registry-backed lockfile after checks completed.",
    time: "8 minutes ago",
    url: `${pr.url}/commits`,
  },
];
export function reviewFixture(
  overview: ReviewOverview,
  scenario: ReviewScenario,
): ReviewResources {
  const pr = structuredClone(overview),
    root = `https://github.com/${pr.repository}`,
    failing = scenario === "failed-checks" || pr.id === "failure";
  if (scenario === "auto-merge")
    pr.mergeMethods = ["squash", "merge", "rebase"];
  if (scenario === "auto-merge")
    pr.actions = [
      {
        kind: "enable-auto-merge",
        label: "Enable auto-merge",
        available: true,
      },
    ];
  if (scenario === "merge-options" || scenario === "long-inspector")
    pr.mergeMethods = ["squash", "merge", "rebase"];
  if (scenario === "long-inspector") {
    pr.title =
      "chore(ci): pin lock-f8d02dcb3899b740 dependency image with a very long repository revision " +
      "abcdef".repeat(18);
    pr.review =
      "0 current-revision approval(s). Required reviews and merge rules are evaluated by GitHub. " +
      "Review notes remain available for the displayed commit. ".repeat(5);
  }
  if (scenario === "workflow-approval") {
    pr.draft = false;
    pr.review = "Workflow approval required before CI can run";
  }
  if (scenario === "permission-denied") {
    pr.canReview = false;
    pr.canMerge = false;
    pr.actionReason =
      "This session has read access. PR reviews require Pull requests write permission.";
  }
  const workflow: ReviewApproval = {
    id: "fork-ci",
    kind: "workflow",
    title: "PR checks · first-time contributor",
    url: `${root}/actions/runs/41074`,
    runId: 41074,
    attempt: 1,
    sha: pr.sha,
    state: "ready",
    permission: "Actions · write",
    reason:
      "This public-fork workflow needs a maintainer's approval before its checks can run.",
  };
  const environment: ReviewApproval = {
    id: "production",
    kind: "environment",
    title: "Publish reviewed packages",
    url: `${root}/actions/runs/41025`,
    runId: 41025,
    attempt: 2,
    sha: pr.sha,
    environment: "npm-production",
    state: "ready",
    permission: "Deployments · write",
    reviewers: ["lapismd/maintainers"],
    reason:
      "You are an eligible reviewer for this pending environment. Approval permits the protected job to continue.",
  };
  const approvals =
    scenario === "workflow-approval" ? [workflow] : [environment];
  if (scenario === "eligibility-checking") {
    environment.state = "checking";
    environment.reason =
      "Checking whether this session can review the pending environment. No action is available until eligibility is confirmed.";
  }
  if (scenario === "reviewer-wait") {
    environment.state = "waiting";
    environment.reason =
      "The environment is waiting for another required reviewer and its protection timer. Your session cannot approve it yet.";
  }
  if (scenario === "permission-denied")
    for (const approval of approvals) {
      approval.state = "denied";
      approval.reason = `The token cannot perform this review. Required permission: ${approval.permission}.`;
    }
  return {
    overview: pr,
    checks:
      scenario === "empty"
        ? []
        : [
            {
              id: "types",
              name: "Types and contracts",
              workflow: "CI",
              state: "passed",
              description: "Type checking and specification validation passed.",
              url: `${root}/actions/runs/41030/job/12001`,
            },
            {
              id: "unit",
              name: "Unit tests",
              workflow: "CI",
              state: failing
                ? "failed"
                : pr.id === "running"
                  ? "running"
                  : "passed",
              description: failing
                ? "Package smoke test failed for the current commit. Open the job log for details."
                : pr.id === "running"
                  ? "Checks are running for this revision."
                  : "88 tests passed for the current commit.",
              url: `${root}/actions/runs/41030/job/12002`,
            },
            {
              id: "package",
              name: "Package acceptance",
              workflow: "CI",
              state: scenario === "workflow-approval" ? "queued" : "passed",
              description:
                scenario === "workflow-approval"
                  ? "Waiting for fork workflow approval."
                  : "Registry package and browser acceptance passed.",
              url: `${root}/actions/runs/41030/job/12003`,
            },
            {
              id: "storybook",
              name: "Storybook accessibility",
              workflow: "Storybook",
              state: "passed",
              description: "Interaction and accessibility journeys passed.",
              url: `${root}/actions/runs/41031/job/12004`,
            },
          ],
    approvals: scenario === "empty" ? [] : approvals,
    activity: {
      items: scenario === "empty" ? [] : events(pr).slice(0, 3),
      next: scenario === "empty" ? undefined : "older",
    },
  };
}
export function olderEvents(overview: ReviewOverview) {
  return { items: events(overview).slice(3) };
}
