import { expect, it, vi } from "vitest";
import { readCommandTarget } from "./command-preflight";
import { GithubTransport } from "./transport";
import { MemoryResponseCache } from "../cache/response-cache";
import type { MaintenanceCommand, MaintenanceItem } from "../maintenance/types";
it.each(["merge-pr", "mark-ready", "comment"] as const)(
  "reads only PR/repository authority for %s, not optional resources",
  async (kind) => {
    const sha = "a".repeat(40),
      item = {
        id: "pr:owner/repo:7",
        repository: "owner/repo",
        number: 7,
        kind: "pull-request",
        target: { kind: "pull-request", sha },
      } as MaintenanceItem;
    const send = vi.fn<typeof fetch>(async (input) =>
      String(input).endsWith("/pulls/7")
        ? Response.json({
            state: "open",
            number: 7,
            title: "Update",
            html_url: "https://github.com/owner/repo/pull/7",
            updated_at: "now",
            draft: kind === "mark-ready",
            node_id: "PR_one",
            head: { sha, ref: "feature" },
            base: { ref: "main" },
            labels: [],
          })
        : Response.json({
            full_name: "owner/repo",
            default_branch: "main",
            permissions: { push: true },
            allow_squash_merge: true,
          }),
    );
    const client = new GithubTransport(
      "invented-minimal",
      new MemoryResponseCache(),
      send,
    );
    const command = {
      itemId: item.id,
      repository: item.repository,
      kind,
      target: item.target,
      requestId: "one",
      inputs: {},
    } as MaintenanceCommand;
    const detail = await readCommandTarget(
      client,
      item,
      "maintainer",
      undefined,
      command,
      new AbortController().signal,
    );
    expect(detail.item.actions.find((a) => a.kind === kind)?.available).toBe(
      true,
    );
    expect(send).toHaveBeenCalledTimes(2);
    expect(
      send.mock.calls.every(
        ([, init]) =>
          !(init?.headers as Record<string, string>)["If-None-Match"],
      ),
    ).toBe(true);
    client.dispose();
  },
);
