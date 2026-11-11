import { expect, it, vi } from "vitest";
import { MaintenanceController } from "./controller.svelte";
import { MaintenanceReadError } from "./types";
import { MemoryMaintenancePort } from "../../catalog/memory-port";
import { detailFixture } from "../../catalog/fixtures";

it("ignores cached progress after selection, revision change, disconnect and disposal", async () => {
  const port = new MemoryMaintenancePort("populated", 0);
  const c = new MaintenanceController(port, port);
  await c.refresh();
  const callbacks: (() => void)[] = [];
  const finishes: (() => void)[] = [];
  vi.spyOn(port, "readDetails").mockImplementation((id, _signal, options) => {
    const detail = detailFixture(
      structuredClone(port.snapshot.items.find((item) => item.id === id)!),
    );
    callbacks.push(() => options?.onProgress?.(detail));
    return new Promise((resolve) => finishes.push(() => resolve(detail)));
  });
  const first = c.select("dependency");
  const second = c.select("failure");
  callbacks[0]!();
  expect(c.detail).toBeNull();
  callbacks[1]!();
  expect(c.detail?.item.id).toBe("failure");
  c.detail = null;
  c.snapshot = structuredClone(c.snapshot!);
  c.snapshot.items.find((item) => item.id === "failure")!.target.sha =
    "changed";
  callbacks[1]!();
  expect(c.detail).toBeNull();
  c.disconnect();
  callbacks[1]!();
  finishes.forEach((finish) => finish());
  await Promise.all([first, second]);
  expect(c.detail).toBeNull();
  c.dispose();
  callbacks[0]!();
  expect(c.detail).toBeNull();
});

it("retains transiently failed previews, clears denied previews and recovers on retry", async () => {
  const port = new MemoryMaintenancePort("populated", 0);
  const c = new MaintenanceController(port, port);
  await c.refresh();
  const detail = detailFixture(
    port.snapshot.items.find((item) => item.id === "dependency")!,
  );
  const read = vi
    .spyOn(port, "readDetails")
    .mockImplementation(async (_id, _signal, options) => {
      options?.onProgress?.(detail);
      throw new MaintenanceReadError("Offline");
    });
  await c.select(detail.item.id);
  expect(c.detail).toEqual(detail);
  expect(c.detailLoading).toBe(false);
  expect(c.detailError).toBe("Offline");
  read.mockRejectedValueOnce(
    new MaintenanceReadError("Access denied", "unavailable", true),
  );
  await c.select(detail.item.id);
  expect(c.detail).toBeNull();
  read.mockResolvedValueOnce(detail);
  await c.select(detail.item.id);
  expect(c.detail).toEqual(detail);
  expect(c.detailError).toBeNull();
  c.dispose();
});

it("closes a removed affected selection even while its detail is still loading", async () => {
  const port = new MemoryMaintenancePort("populated", 0);
  const c = new MaintenanceController(port, port);
  await c.refresh();
  const item = c.snapshot!.items.find((item) => item.id === "dependency")!;
  vi.spyOn(port, "readDetails").mockImplementation(() => new Promise(() => {}));
  void c.select(item.id);
  port.snapshot.items = port.snapshot.items.filter((row) => row.id !== item.id);
  await c.refreshAffected({
    requestId: "fixture",
    itemId: item.id,
    repository: item.repository,
    target: item.target,
    kind: "merge-pr",
    inputs: {},
  });
  expect(c.selectedId).toBeNull();
  expect(c.detailLoading).toBe(false);
  c.dispose();
});
