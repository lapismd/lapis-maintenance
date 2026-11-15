import { expect, it, vi } from "vitest";
import { MaintenanceCommands } from "../maintenance/commands.svelte";
import { GithubCommandPort } from "./command-port";
import { GithubTransport } from "./transport";
import { GithubWriteTransport } from "./write-transport";
import { MemoryResponseCache } from "../cache/response-cache";
import type { MaintenanceDetail } from "../maintenance/types";
it("performs one authoritative preflight for a confirmed command without duplicate controller reads", async () => {
  const detail: MaintenanceDetail = {
    item: {
      id: "pr:owner/repo:7",
      repository: "owner/repo",
      number: 7,
      title: "Update",
      kind: "pull-request",
      category: "dependency",
      status: "passed",
      updatedAt: "now",
      url: "https://github.com/owner/repo/pull/7",
      target: { kind: "pull-request", sha: "a".repeat(40) },
      reasons: [],
      actions: [{ kind: "merge-pr", label: "Merge PR", available: true }],
    },
    description: "",
    checks: [],
    mergeMethods: ["squash"],
  };
  const readDetails = vi.fn(async () => structuredClone(detail));
  const read = {
    readDetails,
    readSnapshot: vi.fn(),
    refreshRepository: vi.fn(),
  };
  const send = vi.fn<typeof fetch>(async () => Response.json({ merged: true }));
  const client = new GithubTransport(
      "invented-single",
      new MemoryResponseCache(),
      send,
    ),
    writer = new GithubWriteTransport("invented-single", send);
  const port = new GithubCommandPort(client, writer, read);
  const commands = new MaintenanceCommands(read, port, async () => {});
  await Promise.all([
    commands.invoke(detail.item, "merge-pr", { mergeMethod: "squash" }),
    commands.invoke(detail.item, "merge-pr", { mergeMethod: "squash" }),
  ]);
  expect(commands.receipts[0]?.status).toBe("completed");
  expect(readDetails).toHaveBeenCalledOnce();
  expect(readDetails).toHaveBeenCalledWith(
    detail.item.id,
    expect.any(AbortSignal),
    { fresh: true },
  );
  expect(send).toHaveBeenCalledOnce();
  commands.dispose();
  client.dispose();
  writer.dispose();
});
