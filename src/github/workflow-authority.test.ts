import { expect, it, vi } from "vitest";
import {
  workflowAction,
  pullActions,
  type GithubAccess,
} from "./action-policy";
import { readWorkflow } from "./workflow-reads";
import { GithubTransport } from "./transport";
import { MemoryResponseCache } from "../cache/response-cache";
import type { GithubRun, GithubPull } from "./models";
const sha = "a".repeat(40);
const access: GithubAccess = {
  login: "maintainer",
  repository: {
    full_name: "owner/repo",
    default_branch: "main",
    private: false,
    permissions: { push: true },
  },
};
const run: GithubRun = {
  id: 12,
  workflow_id: 1,
  name: "PR checks",
  display_title: "Update",
  html_url: "https://github.com/owner/repo/actions/runs/12",
  head_sha: sha,
  head_branch: "feature",
  run_attempt: 2,
  status: "action_required",
  conclusion: null,
  event: "pull_request",
  updated_at: "2026-11-14T10:00:00Z",
  pull_requests: [{ number: 7 }],
};
const pull: GithubPull = {
  state: "open",
  number: 7,
  title: "Update",
  html_url: "https://github.com/owner/repo/pull/7",
  updated_at: run.updated_at,
  draft: false,
  head: {
    sha,
    ref: "feature",
    repo: { full_name: "contributor/repo", private: false, fork: true },
  },
  base: { ref: "main", repo: { full_name: "owner/repo", private: false } },
  labels: [],
};
function fixture(pr = pull, eligible = true) {
  const send = vi.fn<typeof fetch>(async (input) => {
    const path = new URL(String(input)).pathname;
    if (path.endsWith("/pulls/7")) return Response.json(pr);
    if (path.endsWith("/pulls")) return Response.json([pr]);
    if (path.endsWith("/pending_deployments"))
      return Response.json([
        {
          environment: { id: 5, name: "production" },
          current_user_can_approve: eligible,
          wait_timer: 0,
          reviewers: [],
        },
      ]);
    throw Error(`Unexpected ${path}`);
  });
  return {
    send,
    client: new GithubTransport(
      "invented-authority",
      new MemoryResponseCache(),
      send,
    ),
  };
}
it("recognizes status-only approval waits and verifies the exact public fork PR", async () => {
  const { client } = fixture();
  const details = await readWorkflow(
    client,
    "owner/repo",
    run,
    new AbortController().signal,
    {},
    access,
  );
  expect(details[0]!.item.status).toBe("approval-wait");
  expect(
    details[0]!.item.actions.find((a) => a.kind === "approve-run")?.available,
  ).toBe(true);
  client.dispose();
});
it.each([
  "private",
  "changed-sha",
  "closed",
  "wrong-branch",
  "wrong-base",
] as const)(
  "disables workflow approval for %s provenance with a concrete explanation",
  async (kind) => {
    const pr = structuredClone(pull);
    if (kind === "private") pr.head.repo!.private = true;
    if (kind === "changed-sha") pr.head.sha = "b".repeat(40);
    if (kind === "closed") pr.state = "closed";
    if (kind === "wrong-branch") pr.head.ref = "elsewhere";
    if (kind === "wrong-base") pr.base.repo!.full_name = "other/repo";
    const { client } = fixture(pr);
    const detail = (
      await readWorkflow(
        client,
        "owner/repo",
        run,
        new AbortController().signal,
        {},
        access,
      )
    )[0]!;
    const action = detail.item.actions.find((a) => a.kind === "approve-run");
    expect(action?.available).toBe(false);
    expect(action?.reason).toMatch(/fork|revision|branch|open|repository/i);
    client.dispose();
  },
);
it("uses GitHub environment reviewer eligibility even for a non-writer", async () => {
  const { client } = fixture();
  const details = await readWorkflow(
    client,
    "owner/repo",
    { ...run, status: "waiting" },
    new AbortController().signal,
    {},
    {
      ...access,
      repository: { ...access.repository, permissions: { push: false } },
    },
  );
  const wait = details.find((d) => d.item.kind === "approval")!;
  expect(wait.item.actions.every((a) => a.available)).toBe(true);
  client.dispose();
});
it("keeps environment review disabled when GitHub says this user cannot review", async () => {
  const { client } = fixture(pull, false);
  const details = await readWorkflow(
    client,
    "owner/repo",
    { ...run, status: "waiting" },
    new AbortController().signal,
    {},
    access,
  );
  expect(
    details
      .find((d) => d.item.kind === "approval")!
      .item.actions.every((a) => !a.available),
  ).toBe(true);
  client.dispose();
});
it("does not require blanket approval or successful local checks for a merge attempt", () => {
  const actions = pullActions(
    pull,
    {
      item: { status: "review-needed" },
      checks: [],
      mergeMethods: ["squash"],
      description: "",
    } as never,
    access,
  );
  expect(actions.find((a) => a.kind === "merge-pr")?.available).toBe(true);
});
it("does not mistake ordinary completed failures for fork approval", () => {
  expect(
    workflowAction(
      "approve-run",
      { ...run, status: "completed", conclusion: "failure" },
      access,
    ).available,
  ).toBe(false);
});

it("allows GitHub action-required automation PRs from the same public repository", async () => {
  const pr = structuredClone(pull);
  pr.head.repo = { full_name: "owner/repo", private: false, fork: false };
  pr.head.ref = "automation/ci";
  pr.user = { login: "github-actions[bot]" };
  const { client } = fixture(pr);
  const detail = (
    await readWorkflow(
      client,
      "owner/repo",
      {
        ...run,
        status: "completed",
        conclusion: "action_required",
        head_branch: pr.head.ref,
      },
      new AbortController().signal,
      {},
      access,
    )
  )[0]!;
  expect(
    detail.item.actions.find((a) => a.kind === "approve-run")?.available,
  ).toBe(true);
  client.dispose();
});
