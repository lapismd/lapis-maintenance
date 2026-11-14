import { snapshotFixture } from "../fixtures";
import { reviewAvatars } from "./avatars";
import type {
  ReviewResources,
  ReviewOverview,
  ReviewApproval,
  ReviewEvent,
  ReviewPatch,
} from "../../src/maintenance/review/types";
export type ReviewScenario =
  | "ready"
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
    canReview: true,
    canMerge: item.id === "dependency",
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
    files:
      scenario === "empty"
        ? []
        : [
            {
              path: "package.json",
              state: "modified",
              additions: 4,
              deletions: 4,
              url: `${pr.url}/files#diff-package`,
            },
            {
              path: ".changeset/quiet-lapis.md",
              state: "added",
              additions: 8,
              deletions: 0,
              url: `${pr.url}/files#diff-changeset`,
            },
            {
              path: "pnpm-lock.yaml",
              state: "modified",
              additions: 116,
              deletions: 30,
              url: `${pr.url}/files#diff-lock`,
            },
            {
              path: "assets/release-preview.png",
              state: "binary",
              additions: 0,
              deletions: 0,
              url: `${pr.url}/files#diff-image`,
            },
            {
              path: "generated/catalog.json",
              state: "omitted",
              additions: 1280,
              deletions: 640,
              url: `${pr.url}/files#diff-catalog`,
            },
          ],
  };
}
export function olderEvents(overview: ReviewOverview) {
  return { items: events(overview).slice(3) };
}
export function patchFixture(path: string): ReviewPatch {
  if (path.endsWith(".png"))
    return {
      path,
      explanation:
        "Binary file. Open this change on GitHub to inspect the image.",
    };
  if (path.startsWith("generated/"))
    return {
      path,
      explanation:
        "This generated patch exceeds the preview limit. Open the complete change on GitHub.",
    };
  if (path.endsWith(".md"))
    return {
      path,
      patch:
        '@@ -0,0 +1,8 @@\n+---\n+"@lapismd/lapis-notes": patch\n+---\n+\n+Refresh the reviewed first-party dependency cohort.\n+\n+Keep package metadata and release notes aligned.\n+Registry qualification passed.',
    };
  return {
    path,
    patch:
      '@@ -10,8 +10,8 @@\n   "dependencies": {\n-    "@lapismd/design-core": "^0.12.4",\n-    "@lapismd/repository-ui": "^0.2.1",\n+    "@lapismd/design-core": "^0.13.1",\n+    "@lapismd/repository-ui": "^0.2.2",\n     "svelte": "^5.57.3"\n   },\n   "devDependencies": {\n     "@lapismd/spec-validator": "^0.2.0"',
  };
}
