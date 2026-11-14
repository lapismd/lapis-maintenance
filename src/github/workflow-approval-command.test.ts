import { expect, it, vi } from "vitest";
import { GithubCommandPort } from "./command-port";
import { GithubReadPort } from "./read-port";
import { GithubWriteTransport } from "./write-transport";
import { GithubTransport } from "./transport";
import { MemoryResponseCache } from "../cache/response-cache";
import type {
  MaintenanceCommand,
  MaintenanceDetail,
} from "../maintenance/types";

const sha = "a".repeat(40);
it.each(["current", "attempt", "head", "permission"])(
  "revalidates same-repository workflow approval through the real adapters: %s",
  async (change) => {
    const cache = new MemoryResponseCache();
    const send = vi.fn<typeof fetch>(async (input, init) => {
      const path = new URL(String(input)).pathname;
      if (init?.method === "POST") {
        expect(path).toBe("/repos/owner/repo/actions/runs/12/approve");
        return new Response(null, { status: 201 });
      }
      if (path === "/repos/owner/repo")
        return Response.json({
          full_name: "owner/repo",
          private: false,
          permissions: { push: change !== "permission" },
        });
      if (path.endsWith("/runs/12"))
        return Response.json({
          id: 12,
          workflow_id: 1,
          name: "CI",
          display_title: "Update",
          html_url: "https://github.com/owner/repo/actions/runs/12",
          head_sha: sha,
          head_branch: "automation/ci",
          run_attempt: change === "attempt" ? 3 : 2,
          status: "completed",
          conclusion: "action_required",
          event: "pull_request",
          updated_at: "2026-11-14T10:00:00Z",
          pull_requests: [{ number: 7 }],
        });
      if (path.endsWith("/pulls/7"))
        return Response.json({
          number: 7,
          state: "open",
          user: { login: "github-actions[bot]" },
          head: {
            sha: change === "head" ? "b".repeat(40) : sha,
            ref: "automation/ci",
            repo: { full_name: "owner/repo", private: false, fork: false },
          },
          base: {
            ref: "main",
            repo: { full_name: "owner/repo", private: false },
          },
        });
      throw Error(`Unexpected ${path}`);
    });
    const client = new GithubTransport("invented-approval", cache, send);
    const writer = new GithubWriteTransport("invented-approval", send);
    const reader = new GithubReadPort(
      client,
      () => ({ additions: [], exclusions: [] }),
      Date.now,
      "maintainer",
      cache,
    );
    const target = { kind: "workflow" as const, sha, runId: 12, attempt: 2 };
    const item: MaintenanceDetail = {
      item: {
        id: "run:owner/repo:12",
        repository: "owner/repo",
        title: "Update",
        kind: "workflow",
        category: "dependency",
        status: "approval-wait",
        updatedAt: "now",
        url: "https://github.com/owner/repo/actions/runs/12",
        target,
        reasons: [],
        actions: [],
      },
      checks: [],
      description: "",
    };
    reader.remember(item);
    // A stale raw response must never supply command authority.
    await cache.put("json:/repos/owner/repo/actions/runs/12", {
      body: {},
      fetchedAt: Date.now(),
    });
    const command: MaintenanceCommand = {
      requestId: "approval",
      kind: "approve-run",
      repository: "owner/repo",
      itemId: item.item.id,
      target,
      inputs: {},
    };
    const commands = new GithubCommandPort(client, writer, reader);
    const result = await commands.execute(command);
    expect(result.status).toBe(change === "current" ? "accepted" : "rejected");
    expect(
      send.mock.calls.filter(([, init]) => init?.method === "POST"),
    ).toHaveLength(change === "current" ? 1 : 0);
    for (const [, init] of send.mock.calls)
      expect(init?.cache).toBe("no-store");
    await commands.execute(command);
    expect(
      send.mock.calls.filter(([, init]) => init?.method === "POST"),
    ).toHaveLength(change === "current" ? 1 : 0);
    writer.dispose();
    client.dispose();
  },
);
