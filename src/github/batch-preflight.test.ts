import { expect, it, vi } from "vitest";
import { MaintenanceCommands } from "../maintenance/commands.svelte";
import { GithubCommandPort } from "./command-port";
import { GithubTransport } from "./transport";
import { GithubWriteTransport } from "./write-transport";
import { MemoryResponseCache } from "../cache/response-cache";
import { operatorFixture } from "../../catalog/operations/fixtures";
it("preflights each batch member immediately and rejects changed later targets without writing", async () => {
  const items = operatorFixture().items;
  const order: string[] = [];
  const read = {
    readSnapshot: vi.fn(),
    refreshRepository: vi.fn(),
    readDetails: vi.fn(
      async (
        id: string,
        _signal: AbortSignal,
        options?: { fresh?: boolean },
      ) => {
        expect(options?.fresh).toBe(true);
        order.push(`preflight:${id}`);
        const item = structuredClone(items.find((i) => i.id === id)!);
        if (id === items[1]!.id) item.target.sha = "d".repeat(40);
        return { item, description: "", checks: [] };
      },
    ),
  };
  const send = vi.fn<typeof fetch>(async () => {
    order.push("write");
    return new Response(null, { status: 201 });
  });
  const client = new GithubTransport(
    "invented-batch",
    new MemoryResponseCache(),
    send,
  );
  const writer = new GithubWriteTransport("invented-batch", send);
  const commands = new MaintenanceCommands(
    read,
    new GithubCommandPort(client, writer, read),
    async () => {},
  );
  commands.prepareBatch(items, "rerun-failed");
  expect(order).toEqual([]);
  await commands.confirmBatch();
  expect(order).toEqual([
    `preflight:${items[0]!.id}`,
    "write",
    `preflight:${items[1]!.id}`,
  ]);
  expect(commands.receipts.map((r) => r.status)).toEqual([
    "accepted",
    "rejected",
  ]);
  expect(send).toHaveBeenCalledTimes(1);
  commands.dispose();
  client.dispose();
  writer.dispose();
});
