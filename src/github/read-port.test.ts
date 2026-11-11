import { expect, it, vi } from "vitest";
import { GithubTransport } from "./transport";
import { GithubReadPort } from "./read-port";
import { MemoryResponseCache } from "../cache/response-cache";
import type { GithubPull, GithubRun } from "./models";
const sha = "a".repeat(40),
  old = "b".repeat(40),
  time = "2026-11-10T10:00:00Z";
const pull: GithubPull = {
  state: "open",
  number: 7,
  title: "Dependency update",
  html_url: "https://github.com/owner/active/pull/7",
  updated_at: time,
  draft: false,
  head: { sha, ref: "feature" },
  base: { ref: "main" },
  labels: [{ name: "dependencies" }],
  requested_reviewers: [{ login: "maintainer" }],
};
const run: GithubRun = {
  id: 102,
  workflow_id: 1,
  name: "Verify",
  display_title: "CI for PR",
  html_url: "https://github.com/owner/active/actions/runs/102",
  head_sha: sha,
  head_branch: "feature",
  run_attempt: 2,
  status: "completed",
  conclusion: "failure",
  updated_at: time,
  pull_requests: [{ number: 7 }],
};
function fixture(checksUnavailable = false, missingConfig = false) {
  let now = Date.parse(time);
  const send = vi.fn<typeof fetch>(async (input) => {
    const url = new URL(String(input)),
      path = url.pathname;
    if (path.endsWith("/repositories.json"))
      return missingConfig
        ? Response.json({}, { status: 404 })
        : Response.json({
            repositories: [
              { repository: "owner/active" },
              {
                repository: "owner/held",
                holdReason: "Explicit dependency hold",
              },
              { repository: "owner/denied" },
            ],
          });
    if (path === "/repos/owner/denied")
      return Response.json({}, { status: 403 });
    if (path === "/repos/owner/active/pulls/7") return Response.json(pull);
    if (path.endsWith("/pulls"))
      return Response.json(
        path.includes("owner/active")
          ? [pull]
          : path.includes("owner/held")
            ? [{ ...pull, number: 8 }]
            : [],
      );
    if (path.endsWith("/check-runs"))
      return checksUnavailable
        ? Response.json({}, { status: 403 })
        : Response.json({
            check_runs: [
              {
                id: 1,
                name: "Types",
                status: "completed",
                conclusion: "success",
                head_sha: sha,
              },
              {
                id: 2,
                name: "Old failure",
                status: "completed",
                conclusion: "failure",
                head_sha: old,
              },
            ],
          });
    if (path.endsWith("/statuses")) return Response.json([]);
    if (path.endsWith("/reviews"))
      return Response.json([
        {
          id: 1,
          state: "APPROVED",
          commit_id: old,
          submitted_at: time,
          user: { login: "reviewer" },
        },
      ]);
    if (path.endsWith("/actions/runs/102")) return Response.json(run);
    if (path.endsWith("/attempts/2/jobs"))
      return Response.json({
        jobs: [
          {
            id: 91,
            name: "Package smoke",
            status: "completed",
            conclusion: "failure",
            steps: [{ name: "Launch package", conclusion: "failure" }],
          },
        ],
      });
    if (path.endsWith("/pending_deployments"))
      return Response.json([
        {
          environment: { id: 6, name: "production" },
          current_user_can_approve: false,
          wait_timer: 0,
          reviewers: [{ type: "User", reviewer: { login: "release-owner" } }],
        },
      ]);
    if (path.endsWith("/actions/runs"))
      return Response.json({
        workflow_runs: path.includes("owner/active")
          ? [
              run,
              { ...run, id: 101, run_attempt: 1, head_sha: old },
              { ...run, id: 103, workflow_id: 2, head_sha: old },
              {
                ...run,
                id: 104,
                workflow_id: 3,
                head_branch: "main",
                head_sha: "main-new",
                pull_requests: [],
                status: "waiting",
                conclusion: null,
              },
              {
                ...run,
                id: 105,
                workflow_id: 4,
                head_branch: "main",
                head_sha: "old-main",
                pull_requests: [],
              },
            ]
          : [],
      });
    if (path.includes("/commits/")) return Response.json({ sha: "main-new" });
    return Response.json({
      full_name: path.replace("/repos/", ""),
      default_branch: "main",
    });
  });
  const selection = { additions: ["owner/extra"], exclusions: [] as string[] };
  const cache = new MemoryResponseCache();
  const client = new GithubTransport(
    "invented-test-token",
    cache,
    send,
    () => now,
  );
  const reader = new GithubReadPort(
    client,
    () => selection,
    () => now,
    undefined,
    cache,
  );
  return {
    reader,
    client,
    selection,
    send,
    cache,
    now: () => now,
    advance: (milliseconds = 1000) => {
      now += milliseconds;
    },
  };
}
it("discovers defaults/coordinator, preserves holds and access gaps, and ignores superseded revision failures", async () => {
  const { reader, send } = fixture();
  const snapshot = await reader.readSnapshot(new AbortController().signal);
  expect(snapshot.repositories.map((value) => value.repository)).toEqual(
    expect.arrayContaining([
      "lapismd/dependency-automation",
      "owner/active",
      "owner/held",
      "owner/denied",
      "owner/extra",
    ]),
  );
  expect(
    snapshot.repositories.find((value) => value.repository === "owner/denied")
      ?.available,
  ).toBe(false);
  expect(
    snapshot.repositories.find((value) => value.repository === "owner/held")
      ?.holdReason,
  ).toBe("Explicit dependency hold");
  expect(
    snapshot.items.find((value) => value.id === "pr:owner/active:7")?.status,
  ).toBe("review-needed");
  expect(
    snapshot.items
      .filter((value) => value.kind === "workflow")
      .map((value) => value.target),
  ).toEqual(
    expect.arrayContaining([{ kind: "workflow", sha, runId: 102, attempt: 2 }]),
  );
  expect(
    snapshot.items.some(
      (value) => value.id.endsWith(":103") || value.id.endsWith(":105"),
    ),
  ).toBe(false);
  const approval = snapshot.items.find((value) => value.kind === "approval")!;
  expect(approval.reasons.join(" ")).toContain("cannot approve");
  expect(approval.actions.every((action) => !action.available)).toBe(true);
  expect(send.mock.calls.every((call) => call[1]?.method === "GET")).toBe(true);
});
it("keeps incomplete PR checks unavailable and honors explicit exclusions", async () => {
  const { reader, selection } = fixture(true);
  selection.exclusions = ["owner/held"];
  const snapshot = await reader.readSnapshot(new AbortController().signal);
  expect(
    snapshot.repositories.some((value) => value.repository === "owner/held"),
  ).toBe(false);
  expect(
    snapshot.items.find((value) => value.id === "pr:owner/active:7")?.status,
  ).toBe("unavailable");
  expect(
    snapshot.repositories.find((value) => value.repository === "owner/active")
      ?.available,
  ).toBe(false);
});
it("retains actual cache observation time and lazily reads jobs for the selected exact attempt", async () => {
  const { reader, send, advance, selection } = fixture();
  selection.exclusions = ["owner/denied"];
  const signal = new AbortController().signal;
  const first = await reader.readSnapshot(signal);
  const count = send.mock.calls.length;
  advance();
  expect((await reader.readSnapshot(signal)).fetchedAt).toBe(first.fetchedAt);
  expect(send).toHaveBeenCalledTimes(count);
  const detail = await reader.readDetails("run:owner/active:102", signal);
  expect(detail.checks[0]?.description).toContain(
    "Attempt 2: failure · Launch package",
  );
  expect(detail.pullRequest?.item.id).toBe("pr:owner/active:7");
  expect(
    send.mock.calls.some((call) =>
      String(call[0]).includes("/attempts/2/jobs"),
    ),
  ).toBe(true);
  expect(
    send.mock.calls.some((call) =>
      String(call[0]).includes("/attempts/1/jobs"),
    ),
  ).toBe(false);
});
it("reports allowlist discovery failure while still checking explicit additions", async () => {
  const { reader } = fixture(false, true);
  const snapshot = await reader.readSnapshot(new AbortController().signal);
  expect(
    snapshot.repositories.find((value) => value.reason?.includes("discover"))
      ?.available,
  ).toBe(false);
  expect(
    snapshot.repositories.some((value) => value.repository === "owner/extra"),
  ).toBe(true);
  expect(
    new Set(snapshot.repositories.map((repo) => repo.repository)).size,
  ).toBe(snapshot.repositories.length);
});
it("restores a fresh assembled view without rebuilding responses and revalidates on force or expiry", async () => {
  const { reader, client, selection, cache, advance, now } = fixture();
  selection.exclusions = ["owner/denied"];
  const signal = new AbortController().signal;
  const first = await reader.readSnapshot(signal);
  const read = vi.spyOn(client, "read"),
    pages = vi.spyOn(client, "pages");
  const restored = new GithubReadPort(
    client,
    () => selection,
    now,
    undefined,
    cache,
  );
  expect(await restored.readSnapshot(signal)).toEqual(first);
  expect(read).not.toHaveBeenCalled();
  expect(pages).not.toHaveBeenCalled();
  await restored.readSnapshot(signal, { force: true });
  expect(read).toHaveBeenCalled();
  read.mockClear();
  pages.mockClear();
  advance(300_001);
  await reader.readSnapshot(signal);
  expect(read).toHaveBeenCalled();
});
it("publishes stale details before revalidation completes and never previews command validation", async () => {
  const { reader, client, send, advance } = fixture();
  const signal = new AbortController().signal;
  await reader.readSnapshot(signal);
  const first = await reader.readDetails("pr:owner/active:7", signal);
  advance(300_001);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const original = send.getMockImplementation()!;
  send.mockImplementation(async (input, init) => {
    if (new URL(String(input)).pathname === "/repos/owner/active/pulls/7")
      await gate;
    return original(input, init);
  });
  const progress = vi.fn();
  const pending = reader.readDetails(first.item.id, signal, {
    onProgress: progress,
  });
  void pending.catch(() => {});
  try {
    await vi.waitFor(() => expect(progress).toHaveBeenCalledWith(first));
  } finally {
    release();
    await pending;
  }
  const validation = vi.fn();
  await reader.readDetails(first.item.id, signal, {
    fresh: true,
    onProgress: validation,
  });
  expect(validation).not.toHaveBeenCalled();
  client.dispose();
});
it("bounds workflow inventory to current heads and pending approvals", async () => {
  const { reader, send } = fixture();
  await reader.readSnapshot(new AbortController().signal);
  const queries = send.mock.calls
    .map((call) => new URL(String(call[0])))
    .filter((url) => url.pathname.endsWith("/actions/runs"));
  expect(queries.length).toBeGreaterThan(0);
  expect(
    queries.every(
      (url) =>
        url.searchParams.has("head_sha") ||
        ["waiting", "action_required"].includes(
          url.searchParams.get("status") ?? "",
        ),
    ),
  ).toBe(true);
  expect(queries.some((url) => url.searchParams.has("created"))).toBe(false);
});
it("reopens cached card details immediately while fresh validation and expiry bypass them", async () => {
  const { reader, client, advance } = fixture();
  const signal = new AbortController().signal;
  await reader.readSnapshot(signal);
  const first = await reader.readDetails("pr:owner/active:7", signal);
  const read = vi.spyOn(client, "read"),
    pages = vi.spyOn(client, "pages");
  expect(await reader.readDetails("pr:owner/active:7", signal)).toEqual(first);
  expect(read).not.toHaveBeenCalled();
  expect(pages).not.toHaveBeenCalled();
  await reader.readDetails("pr:owner/active:7", signal, { fresh: true });
  expect(read).toHaveBeenCalled();
  read.mockClear();
  advance(300_001);
  await reader.readDetails("pr:owner/active:7", signal);
  expect(read).toHaveBeenCalled();
});
it("publishes discovered repositories before slow activity reads finish", async () => {
  const { reader, send } = fixture();
  const original = send.getMockImplementation()!;
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  send.mockImplementation(async (input, init) => {
    if (new URL(String(input)).pathname.endsWith("/pulls")) await pending;
    return original(input, init);
  });
  const progress = vi.fn();
  const reading = reader.readSnapshot(new AbortController().signal, {
    onProgress: progress,
  });
  await vi.waitFor(() => expect(progress).toHaveBeenCalled());
  expect(progress.mock.calls[0]![0].repositories).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ repository: "owner/active", loading: true }),
    ]),
  );
  expect(progress.mock.calls[0]![0].items).toEqual([]);
  release();
  const snapshot = await reading;
  expect(snapshot.items.length).toBeGreaterThan(0);
  expect(snapshot.repositories.every((repo) => !repo.loading)).toBe(true);
});
it("ignores closed-PR workflow branches and links an open current head even without run PR metadata", async () => {
  const { reader, send } = fixture();
  const original = send.getMockImplementation()!;
  send.mockImplementation(async (input, init) => {
    const path = new URL(String(input)).pathname;
    if (path === "/repos/owner/active/actions/runs")
      return Response.json({
        workflow_runs: [
          { ...run, event: "pull_request", pull_requests: [] },
          {
            ...run,
            id: 999,
            workflow_id: 999,
            event: "pull_request",
            head_branch: "deleted-pr-branch",
            head_sha: old,
            pull_requests: [],
          },
        ],
      });
    if (path.endsWith("/commits/deleted-pr-branch"))
      return Response.json({ message: "No commit found" }, { status: 422 });
    return original(input, init);
  });
  const snapshot = await reader.readSnapshot(new AbortController().signal);
  expect(
    snapshot.repositories.find((repo) => repo.repository === "owner/active")
      ?.available,
  ).toBe(true);
  expect(
    send.mock.calls.some((call) =>
      String(call[0]).includes("deleted-pr-branch"),
    ),
  ).toBe(false);
  expect(
    snapshot.items.some((item) => item.id === "run:owner/active:102"),
  ).toBe(true);
});
it("distinguishes cancelled current-head checks from missing or unavailable check data", async () => {
  const { reader, send } = fixture();
  const original = send.getMockImplementation()!;
  send.mockImplementation(async (input, init) =>
    new URL(String(input)).pathname.endsWith("/check-runs")
      ? Response.json({
          check_runs: [
            {
              id: 1,
              name: "Cancelled CI",
              status: "completed",
              conclusion: "cancelled",
              head_sha: sha,
            },
          ],
        })
      : original(input, init),
  );
  const snapshot = await reader.readSnapshot(new AbortController().signal);
  expect(
    snapshot.items.find((value) => value.id === "pr:owner/active:7")?.status,
  ).toBe("cancelled");
});
it("drops denied persisted and in-memory detail previews rather than showing them on retry", async () => {
  const { reader, client, send, advance } = fixture();
  const signal = new AbortController().signal;
  await reader.readSnapshot(signal);
  await reader.readDetails("pr:owner/active:7", signal);
  advance(300_001);
  const original = send.getMockImplementation()!;
  send.mockImplementation(async (input, init) =>
    new URL(String(input)).pathname === "/repos/owner/active/pulls/7"
      ? Response.json({}, { status: 403 })
      : original(input, init),
  );
  const first = vi.fn();
  await expect(
    reader.readDetails("pr:owner/active:7", signal, { onProgress: first }),
  ).rejects.toMatchObject({ discardPreview: true });
  expect(first).toHaveBeenCalled();
  const retry = vi.fn();
  await expect(
    reader.readDetails("pr:owner/active:7", signal, { onProgress: retry }),
  ).rejects.toThrow();
  expect(retry).not.toHaveBeenCalled();
  client.dispose();
});
