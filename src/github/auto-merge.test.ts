import { expect, it, vi } from "vitest";
import { GithubCommandPort } from "./command-port";
import { GithubReadPort } from "./read-port";
import { GithubTransport } from "./transport";
import { GithubWriteTransport } from "./write-transport";
import { MemoryResponseCache } from "../cache/response-cache";
import type { MaintenanceCommand } from "../maintenance/types";
const sha = "a".repeat(40);
function fixture(
  change = "current",
  disable = false,
  method: "squash" | "merge" | "rebase" = "squash",
) {
  const send = vi.fn<typeof fetch>(async (input, init) => {
    const path = new URL(String(input)).pathname;
    if (path === "/graphql") {
      if (change === "network") throw new TypeError("Interrupted");
      if (change === "denied")
        return Response.json({ errors: [{ type: "FORBIDDEN" }] });
      return Response.json({
        data: {
          [disable
            ? "disablePullRequestAutoMerge"
            : "enablePullRequestAutoMerge"]: {
            pullRequest: {
              id: "PR_7",
              headRefOid: sha,
              autoMergeRequest: disable
                ? null
                : { mergeMethod: method.toUpperCase() },
            },
          },
        },
      });
    }
    if (path === "/repos/owner/repo")
      return Response.json({
        full_name: "owner/repo",
        allow_auto_merge: change !== "settings",
        permissions: { push: change !== "permission" },
        allow_squash_merge: true,
        allow_merge_commit: true,
        allow_rebase_merge: change !== "method",
      });
    if (path.endsWith("/pulls/7"))
      return Response.json({
        node_id: "PR_7",
        number: 7,
        title: "Update",
        state: "open",
        draft: change === "draft",
        labels: [],
        head: {
          sha: change === "revision" ? "b".repeat(40) : sha,
          ref: "feature",
        },
        base: { ref: "main" },
        html_url: "https://github.com/owner/repo/pull/7",
        updated_at: "now",
        auto_merge:
          disable || change === "enabled"
            ? { merge_method: "squash", enabled_by: { login: "maintainer" } }
            : null,
      });
    throw Error(`Unexpected ${path}`);
  });
  const cache = new MemoryResponseCache(),
    client = new GithubTransport("invented-auto-merge", cache, send);
  const reader = new GithubReadPort(
    client,
    () => ({ additions: [], exclusions: [] }),
    Date.now,
    "maintainer",
    cache,
  );
  const item = {
    id: "pr:owner/repo:7",
    repository: "owner/repo",
    title: "Update",
    number: 7,
    kind: "pull-request" as const,
    category: "dependency" as const,
    status: "running" as const,
    target: { kind: "pull-request" as const, sha },
    url: "https://github.com/owner/repo/pull/7",
    updatedAt: "now",
    actions: [],
    reasons: [],
  };
  reader.remember({ item, checks: [], description: "" });
  const command: MaintenanceCommand = {
    requestId: "auto",
    itemId: item.id,
    repository: item.repository,
    target: item.target,
    kind: disable ? "disable-auto-merge" : "enable-auto-merge",
    inputs: { mergeMethod: method },
  };
  const writer = new GithubWriteTransport("invented-auto-merge", send);
  return {
    port: new GithubCommandPort(client, writer, reader),
    command,
    send,
    client,
    writer,
  };
}
it.each(["squash", "merge", "rebase"] as const)(
  "schedules %s auto-merge for the fresh displayed head exactly once",
  async (method) => {
    const { port, command, send, client, writer } = fixture(
      "current",
      false,
      method,
    );
    expect((await port.execute(command)).status).toBe("accepted");
    await port.execute(command);
    const writes = send.mock.calls.filter(([url]) =>
      String(url).endsWith("/graphql"),
    );
    expect(writes).toHaveLength(1);
    expect(JSON.parse(String(writes[0]![1]?.body)).variables.input).toEqual({
      pullRequestId: "PR_7",
      expectedHeadOid: sha,
      mergeMethod: method.toUpperCase(),
    });
    expect(
      send.mock.calls.filter(([url]) => String(url).endsWith("/pulls/7")),
    ).toHaveLength(1);
    writer.dispose();
    client.dispose();
  },
);
it.each(["revision", "permission", "settings", "draft", "enabled", "method"])(
  "rejects %s changes before scheduling",
  async (change) => {
    const { port, command, send, client, writer } = fixture(
      change,
      false,
      "rebase",
    );
    expect((await port.execute(command)).status).toBe("rejected");
    expect(
      send.mock.calls.filter(([url]) => String(url).endsWith("/graphql")),
    ).toHaveLength(0);
    writer.dispose();
    client.dispose();
  },
);
it("disables an existing schedule without merging the pull request", async () => {
  const { port, command, send, client, writer } = fixture("current", true);
  expect((await port.execute(command)).status).toBe("completed");
  const write = send.mock.calls.find(([url]) =>
    String(url).endsWith("/graphql"),
  )!;
  expect(JSON.parse(String(write[1]?.body))).toMatchObject({
    query: expect.stringContaining("disablePullRequestAutoMerge"),
    variables: { input: { pullRequestId: "PR_7" } },
  });
  writer.dispose();
  client.dispose();
});
it.each(["denied", "network"])(
  "reports %s without replaying an uncertain schedule",
  async (change) => {
    const { port, command, send, client, writer } = fixture(change);
    expect((await port.execute(command)).status).toBe(
      change === "denied" ? "rejected" : "uncertain",
    );
    if (change === "network") {
      expect(
        (await port.execute({ ...command, requestId: "retry" })).status,
      ).toBe("rejected");
      expect(
        send.mock.calls.filter(([url]) => String(url).endsWith("/graphql")),
      ).toHaveLength(1);
    }
    writer.dispose();
    client.dispose();
  },
);
