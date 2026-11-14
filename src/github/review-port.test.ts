import { expect, it, vi } from "vitest";
import { GithubTransport } from "./transport";
import { GithubReadPort } from "./read-port";
import { GithubReviewPort } from "./review-port";
import { ReviewController } from "../maintenance/review/controller.svelte";
import { MemoryResponseCache } from "../cache/response-cache";
import type { GithubPull } from "./models";
const repository = "lapismd/maintenance",
  id = `pr:${repository}:1`,
  sha = "a".repeat(40);
function fixture() {
  const cache = new MemoryResponseCache();
  let denied = false,
    activityDenied = false;
  const pr: GithubPull = {
    number: 1,
    title: "Live PR",
    state: "open",
    draft: false,
    user: { login: "bot" },
    head: { sha, ref: "update" },
    base: { ref: "main" },
    labels: [],
    updated_at: new Date().toISOString(),
    html_url: `https://github.com/${repository}/pull/1`,
  };
  const send = vi.fn<typeof fetch>(async (input) => {
    const path = new URL(String(input)).pathname;
    if (denied) return Response.json({ message: "Denied" }, { status: 403 });
    if (path.endsWith("/pulls/1")) return Response.json(pr);
    if (path === `/repos/${repository}`)
      return Response.json({
        full_name: repository,
        permissions: { push: true },
        allow_squash_merge: true,
      });
    if (path.endsWith("/check-runs"))
      return Response.json({
        check_runs: [
          {
            id: 1,
            name: "CI",
            head_sha: pr.head.sha,
            status: "completed",
            conclusion: "success",
            html_url: `${pr.html_url}/checks`,
          },
        ],
      });
    if (path.endsWith("/statuses")) return Response.json([]);
    if (path.endsWith("/actions/runs"))
      return Response.json({ workflow_runs: [] });
    if (path.endsWith("/timeline"))
      return activityDenied
        ? Response.json({ message: "No timeline" }, { status: 403 })
        : Response.json([
            {
              id: 10,
              event: "commented",
              body: "Real comment",
              actor: {
                login: "reviewer",
                avatar_url: "https://avatars.githubusercontent.com/u/1",
              },
              created_at: new Date().toISOString(),
              html_url: `${pr.html_url}#issuecomment-10`,
            },
          ]);
    throw Error(`Unexpected read ${path}`);
  });
  const client = new GithubTransport("invented", cache, send),
    reader = new GithubReadPort(
      client,
      () => ({ additions: [], exclusions: [] }),
      Date.now,
      "maintainer",
      cache,
    );
  reader.remember({
    item: {
      id,
      repository,
      title: pr.title,
      number: 1,
      kind: "pull-request",
      status: "passed",
      category: "product",
      updatedAt: pr.updated_at,
      url: pr.html_url,
      target: { kind: "pull-request", sha },
      reasons: [],
      actions: [],
    },
    description: "",
    checks: [],
  });
  const port = new GithubReviewPort(
    client,
    reader,
    "maintainer",
    () => "selection",
    cache,
  );
  const controller = new ReviewController([], port, { execute: vi.fn() });
  return {
    cache,
    client,
    reader,
    port,
    controller,
    send,
    pr,
    deny: () => (denied = true),
    denyActivity: () => (activityDenied = true),
  };
}
it("shows warm checks synchronously and makes zero GitHub requests for fresh reopens, loading activity only on demand", async () => {
  const f = fixture();
  await f.controller.select(id);
  expect(f.controller.canApprove).toBe(true);
  expect(
    f.send.mock.calls.some(([url]) => String(url).includes("timeline")),
  ).toBe(false);
  const count = f.send.mock.calls.length;
  f.controller.clearSelection();
  const reopening = f.controller.select(id);
  expect(f.controller.resources.checks.data?.[0]?.name).toBe("CI");
  await reopening;
  expect(f.send).toHaveBeenCalledTimes(count);
  f.controller.setTab("activity");
  await vi.waitFor(() =>
    expect(f.controller.resources.activity.data?.items[0]?.body).toBe(
      "Real comment",
    ),
  );
  f.controller.dispose();
  f.port.dispose();
  f.client.dispose();
  await f.port.drain();
  await f.client.drain();
});
it("isolates optional timeline denial and rejects stale heads/permission-denied previews", async () => {
  const f = fixture();
  await f.controller.select(id);
  f.denyActivity();
  await f.controller.load("activity");
  expect(f.controller.resources.activity.error).toContain("HTTP 403");
  expect(f.controller.canApprove).toBe(true);
  f.pr.head.sha = "b".repeat(40);
  await f.controller.load("overview", undefined, true);
  expect(f.controller.overview?.sha).toBe(f.pr.head.sha);
  expect(f.controller.resources.checks.data).toBeUndefined();
  expect(f.controller.canApprove).toBe(false);
  await f.controller.load("checks", undefined, true);
  expect(f.controller.canApprove).toBe(true);
  f.deny();
  await f.controller.load("overview", undefined, true);
  expect(f.controller.overview).toBeUndefined();
  expect(f.controller.canMerge).toBe(false);
  f.controller.dispose();
  f.port.dispose();
  f.client.dispose();
  await f.port.drain();
});
it("allows a directly routed closed PR without inventing open authority", async () => {
  const f = fixture();
  f.pr.state = "closed";
  f.pr.merged_at = new Date().toISOString();
  await f.controller.select(id);
  expect(f.controller.overview?.state).toBe("merged");
  expect(f.controller.canMerge).toBe(false);
  expect(f.controller.canApprove).toBe(false);
  f.controller.dispose();
  f.port.dispose();
  f.client.dispose();
  await f.port.drain();
});
