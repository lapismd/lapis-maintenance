import { expect, it, vi } from "vitest";
import { GithubCommandPort } from "./command-port";
import { GithubWriteTransport } from "./write-transport";
import { GithubTransport } from "./transport";
import { MemoryResponseCache } from "../cache/response-cache";
import type {
  MaintenanceCommand,
  MaintenanceDetail,
  MaintenanceReadPort,
} from "../maintenance/types";
const sha = "a".repeat(40);
function fixture(kind: MaintenanceCommand["kind"] = "merge-pr", status = 200) {
  const workflow = ["rerun-failed", "cancel-run", "approve-run"].includes(kind);
  const command: MaintenanceCommand = {
    requestId: "one",
    repository: "owner/repo",
    itemId: workflow ? "run:owner/repo:12" : "pr:owner/repo:7",
    kind,
    target: workflow
      ? { kind: "workflow", sha, runId: 12, attempt: 2 }
      : { kind: "pull-request", sha },
    inputs: { mergeMethod: "squash", body: "Reviewed this revision." },
  };
  const detail: MaintenanceDetail = {
    item: {
      id: command.itemId,
      repository: command.repository,
      number: workflow ? undefined : 7,
      title: "Update",
      kind: workflow ? "workflow" : "pull-request",
      category: "dependency",
      status: "passed",
      updatedAt: "now",
      url: "https://github.com/owner/repo/pull/7",
      reasons: [],
      target: command.target,
      actions: [{ kind, label: "Action", available: true }],
    },
    description: "PR",
    checks: [{ name: "CI", state: "passed" }],
    mergeMethods: ["squash"],
  };
  const send = vi.fn<typeof fetch>(async (_input, init) => {
    const path = new URL(String(_input)).pathname;
    if (init?.method === "GET")
      return Response.json({
        state: "open",
        draft: true,
        node_id: "PR_one",
        head: { sha },
      });
    if (status !== 200) return Response.json({}, { status });
    if (path === "/graphql")
      return Response.json({
        data: {
          markPullRequestReadyForReview: {
            pullRequest: { isDraft: false, headRefOid: sha },
          },
        },
      });
    if (path.endsWith("/reviews")) {
      const event = JSON.parse(String(init?.body)).event;
      return Response.json(
        {
          id: 77,
          commit_id: sha,
          state: {
            APPROVE: "APPROVED",
            REQUEST_CHANGES: "CHANGES_REQUESTED",
            COMMENT: "COMMENTED",
          }[event as "APPROVE"],
        },
        { status: 201 },
      );
    }
    if (workflow)
      return new Response(null, { status: kind === "cancel-run" ? 202 : 201 });
    return Response.json({ merged: true });
  });
  const readDetails = vi.fn(async () => structuredClone(detail));
  const reader: MaintenanceReadPort = { readDetails, readSnapshot: vi.fn() };
  const client = new GithubTransport(
    "invented-command-token",
    new MemoryResponseCache(),
    send,
  );
  const writer = new GithubWriteTransport("invented-command-token", send);
  const port = new GithubCommandPort(client, writer, reader);
  return { command, detail, send, readDetails, writer, client, port };
}
it.each(["approve-pr", "request-changes", "comment"] as const)(
  "submits %s against the displayed commit",
  async (kind) => {
    const { port, command, send, readDetails } = fixture(kind);
    expect((await port.execute(command)).status).toBe("completed");
    expect(readDetails).toHaveBeenCalledOnce();
    const [url, init] = send.mock.calls[0]!;
    expect(String(url)).toBe(
      "https://api.github.com/repos/owner/repo/pulls/7/reviews",
    );
    expect(JSON.parse(String(init?.body))).toMatchObject({
      commit_id: sha,
      body: "Reviewed this revision.",
    });
    expect(init).toMatchObject({
      method: "POST",
      cache: "no-store",
      credentials: "omit",
      redirect: "error",
    });
  },
);
it("binds a merge to its SHA and allowed method and deduplicates the request", async () => {
  const { port, command, send } = fixture();
  const results = await Promise.all([
    port.execute(command),
    port.execute(command),
  ]);
  expect(results.map((r) => r.status)).toEqual(["completed", "completed"]);
  await port.execute(command);
  expect(send).toHaveBeenCalledOnce();
  expect(JSON.parse(String(send.mock.calls[0]![1]?.body))).toEqual({
    sha,
    merge_method: "squash",
  });
});
it("rejects a changed PR revision or lost capability before writing", async () => {
  for (const changed of ["sha", "permissions"]) {
    const { port, command, send, detail } = fixture();
    if (changed === "sha")
      detail.item.target = { kind: "pull-request", sha: "b".repeat(40) };
    else detail.item.actions[0]!.available = false;
    expect((await port.execute(command)).status).toBe("rejected");
    expect(send).not.toHaveBeenCalled();
  }
});
it("rejects unsupported merge methods, missing review comments and release actions", async () => {
  for (const kind of ["merge-pr", "comment", "approve-deployment"] as const) {
    const { port, command, send } = fixture(kind);
    command.inputs = kind === "merge-pr" ? { mergeMethod: "rebase" } : {};
    expect((await port.execute(command)).status).toBe("rejected");
    expect(send).not.toHaveBeenCalled();
  }
});
it("reports permission and protected-branch rejections without a retry or bypass", async () => {
  for (const status of [401, 403, 405, 409, 422, 429]) {
    const { port, command, send } = fixture("merge-pr", status);
    expect((await port.execute(command)).status).toBe("rejected");
    expect(send).toHaveBeenCalledOnce();
  }
  const { port, command, send } = fixture();
  send.mockResolvedValue(Response.json({ merged: false }));
  expect((await port.execute(command)).status).toBe("rejected");
  expect(send).toHaveBeenCalledOnce();
});
it("retains uncertain server/network outcomes and blocks replay with a new request ID", async () => {
  for (const failure of ["network", "server"]) {
    const { port, command, send } = fixture("merge-pr", 503);
    if (failure === "network")
      send.mockRejectedValue(new TypeError("Network failed"));
    expect((await port.execute(command)).status).toBe("uncertain");
    expect((await port.execute({ ...command, requestId: "two" })).status).toBe(
      "rejected",
    );
    expect(send).toHaveBeenCalledOnce();
  }
});
it.each(["rerun-failed", "cancel-run"] as const)(
  "accepts %s for an exact workflow attempt",
  async (kind) => {
    const { port, command, send } = fixture(kind);
    expect((await port.execute(command)).status).toBe("accepted");
    expect(String(send.mock.calls[0]![0])).toContain(
      kind === "cancel-run" ? "/12/cancel" : "/12/rerun-failed-jobs",
    );
  },
);
it("rejects changed workflow attempts and disposed write sessions", async () => {
  const { port, command, detail, send } = fixture("rerun-failed");
  detail.item.target = { kind: "workflow", sha, runId: 12, attempt: 3 };
  expect((await port.execute(command)).status).toBe("rejected");
  expect(send).not.toHaveBeenCalled();
  const closed = fixture();
  closed.writer.dispose();
  expect((await closed.port.execute(closed.command)).status).toBe("rejected");
  expect(closed.send).not.toHaveBeenCalled();
});
it("marks a freshly revalidated draft ready with its node ID", async () => {
  const { port, command, send } = fixture("mark-ready");
  expect((await port.execute(command)).status).toBe("completed");
  expect(send.mock.calls.map((call) => call[1]?.method)).toEqual([
    "GET",
    "POST",
  ]);
  expect(JSON.parse(String(send.mock.calls[1]![1]?.body))).toMatchObject({
    variables: { id: "PR_one" },
  });
});
it("approves a specifically revalidated workflow run and reports submission separately from CI completion", async () => {
  const { port, command, send, readDetails } = fixture("approve-run");
  expect((await port.execute(command)).status).toBe("accepted");
  expect(readDetails).toHaveBeenCalledWith(
    command.itemId,
    expect.any(AbortSignal),
    { fresh: true },
  );
  expect(send).toHaveBeenCalledOnce();
  expect(String(send.mock.calls[0]![0])).toBe(
    "https://api.github.com/repos/owner/repo/actions/runs/12/approve",
  );
});
