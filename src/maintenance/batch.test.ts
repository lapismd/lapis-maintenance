import { describe, expect, it, vi } from "vitest";
import { MaintenanceCommands } from "./commands.svelte";
import type { MaintenanceItem, MaintenanceReadPort } from "./types";
const item = (id: string, available = true): MaintenanceItem => ({
  id,
  repository: "example/public",
  title: id,
  kind: "workflow",
  status: "failed",
  category: "product",
  updatedAt: "2026-11-15",
  url: "https://github.com/example/public",
  reasons: [],
  target: {
    kind: "workflow",
    sha: "a".repeat(40),
    runId: Number(id),
    attempt: 1,
  },
  actions: [{ kind: "rerun-failed", label: "Rerun failed jobs", available }],
});
describe("confirmed batches", () => {
  it("admits individually eligible distinct targets and never writes during preparation", async () => {
    const execute = vi
      .fn()
      .mockResolvedValue({ status: "accepted", message: "queued" });
    const commands = new MaintenanceCommands(
      {} as MaintenanceReadPort,
      { execute },
      async () => {},
    );
    commands.prepareBatch(
      [item("1"), item("1"), item("2", false)],
      "rerun-failed",
    );
    expect(execute).not.toHaveBeenCalled();
    expect(commands.batchConfirmation?.commands).toHaveLength(1);
    await commands.confirmBatch();
    expect(execute).toHaveBeenCalledTimes(1);
    expect(commands.receipts[0]?.status).toBe("accepted");
  });
  it("retains partial and uncertain results without replay", async () => {
    const execute = vi
      .fn()
      .mockResolvedValueOnce({ status: "completed", message: "done" })
      .mockRejectedValueOnce(new Error("unknown"));
    const commands = new MaintenanceCommands(
      {} as MaintenanceReadPort,
      { execute },
      async () => {},
    );
    commands.prepareBatch([item("1"), item("2")], "rerun-failed");
    await Promise.all([commands.confirmBatch(), commands.confirmBatch()]);
    expect(execute).toHaveBeenCalledTimes(2);
    expect(commands.receipts.map((r) => r.status)).toEqual([
      "completed",
      "uncertain",
    ]);
    commands.prepareBatch([item("2")], "rerun-failed");
    expect(commands.batchConfirmation).toBeNull();
  });
});
it("stops remaining batch submissions on disposal", async () => {
  let resolve!: (value: { status: "accepted"; message: string }) => void;
  const execute = vi.fn(
    () =>
      new Promise<{ status: "accepted"; message: string }>((r) => {
        resolve = r;
      }),
  );
  const commands = new MaintenanceCommands(
    {} as MaintenanceReadPort,
    { execute },
    async () => {},
  );
  commands.prepareBatch([item("1"), item("2")], "rerun-failed");
  const pending = commands.confirmBatch();
  commands.dispose();
  resolve({ status: "accepted", message: "queued" });
  await pending;
  expect(execute).toHaveBeenCalledTimes(1);
  expect(execute.mock.calls[0]).toBeDefined();
});
