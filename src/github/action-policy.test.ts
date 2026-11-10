import { expect, it } from "vitest";
import {
  pullActions,
  workflowAction,
  mergeMethods,
  type GithubAccess,
} from "./action-policy";
import type { GithubPull, GithubRun } from "./models";
import type { MaintenanceDetail } from "../maintenance/types";
const access: GithubAccess = {
  login: "maintainer",
  repository: {
    full_name: "owner/repo",
    default_branch: "main",
    permissions: { push: true },
    allow_squash_merge: true,
  },
};
const pull = {
  state: "open",
  draft: false,
  user: { login: "author" },
  mergeable: true,
  mergeable_state: "clean",
} as GithubPull;
const detail = {
  item: { status: "passed" },
  checks: [{ name: "CI", state: "passed" }],
  coverage: [],
  mergeMethods: ["squash"],
} as unknown as MaintenanceDetail;
it("permits only clean checked PRs using repository merge methods", () => {
  expect(mergeMethods(access.repository)).toEqual(["squash"]);
  expect(
    pullActions(pull, detail, access).find((a) => a.kind === "merge-pr")
      ?.available,
  ).toBe(true);
  for (const value of [
    { ...detail, coverage: ["Checks unavailable"] },
    { ...detail, checks: [{ name: "CI", state: "failed" as const }] },
    { ...detail, item: { ...detail.item, status: "blocked" as const } },
    { ...detail, mergeMethods: [] },
  ])
    expect(
      pullActions(pull, value, access).find((a) => a.kind === "merge-pr")
        ?.available,
    ).toBe(false);
  expect(
    pullActions({ ...pull, mergeable_state: "blocked" }, detail, access).find(
      (a) => a.kind === "merge-pr",
    )?.available,
  ).toBe(false);
});
it("keeps read-only sessions and insufficient repository roles disabled", () => {
  expect(pullActions(pull, detail).every((a) => !a.available)).toBe(true);
  expect(
    pullActions(pull, detail, {
      ...access,
      repository: { ...access.repository, permissions: { push: false } },
    }).find((a) => a.kind === "merge-pr")?.available,
  ).toBe(false);
});
it("does not allow PR approval without reported current-revision checks", () => {
  const actions = pullActions(pull, { ...detail, checks: [] }, access);
  expect(
    actions.find((action) => action.kind === "approve-pr")?.available,
  ).toBe(false);
  expect(
    actions.find((action) => action.kind === "approve-pr")?.reason,
  ).toContain("checks");
});
it("prevents self approvals while retaining review comments and author readiness", () => {
  const own = { ...pull, user: { login: access.login } };
  const actions = pullActions(own, detail, access);
  expect(actions.find((a) => a.kind === "approve-pr")?.available).toBe(false);
  expect(actions.find((a) => a.kind === "request-changes")?.available).toBe(
    false,
  );
  expect(actions.find((a) => a.kind === "comment")?.available).toBe(true);
  expect(
    pullActions({ ...own, draft: true, node_id: "PR_one" }, detail, access)[0]
      ?.available,
  ).toBe(true);
});
it("limits workflow operations to the current eligible state and writer role", () => {
  const failed = { status: "completed", conclusion: "failure" } as GithubRun;
  expect(workflowAction("rerun-failed", failed, access).available).toBe(true);
  expect(workflowAction("cancel-run", failed, access).available).toBe(false);
  expect(
    workflowAction("cancel-run", { ...failed, status: "in_progress" }, access)
      .available,
  ).toBe(true);
  expect(
    workflowAction("rerun-failed", failed, {
      ...access,
      repository: { ...access.repository, permissions: {} },
    }).available,
  ).toBe(false);
});
