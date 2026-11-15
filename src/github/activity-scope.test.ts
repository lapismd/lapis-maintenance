import { expect, it, vi } from "vitest";
import { GithubActivityPort } from "./activity-port";
import { GithubTransport } from "./transport";
import { MemoryResponseCache } from "../cache/response-cache";
import { ActivityController } from "../maintenance/activity/controller.svelte";
import { MemoryActivityPort } from "../../catalog/activity/memory-port";
import { snapshotFixture } from "../../catalog/fixtures";
it("does not expand an explicitly empty branch-filter scope into all repositories", async () => {
  const send = vi.fn(async () => Response.json([]));
  const client = new GithubTransport(
    "invented-scope",
    new MemoryResponseCache(),
    send,
  );
  const port = new GithubActivityPort(client, snapshotFixture);
  try {
    const result = await port.readPage(
      {
        search: "",
        repositories: [],
        repositoriesRestricted: true,
        statuses: [],
        kinds: [],
      },
      undefined,
      new AbortController().signal,
    );
    expect(result.events).toEqual([]);
    expect(result.nextCursor).toBeUndefined();
    expect(send).not.toHaveBeenCalled();
  } finally {
    port.dispose();
    client.dispose();
  }
});
it("invalidates activity query identity when an empty scope becomes explicitly restricted", async () => {
  const port = new MemoryActivityPort("populated", 0);
  const controller = new ActivityController(port);
  const query = { search: "", repositories: [], statuses: [], kinds: [] };
  await controller.setQuery(query);
  expect(controller.events.length).toBeGreaterThan(0);
  await controller.setQuery({ ...query, repositoriesRestricted: true });
  expect(controller.events).toEqual([]);
  expect(port.calls).toHaveLength(2);
  controller.dispose();
});
