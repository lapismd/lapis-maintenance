import { describe, expect, it } from "vitest";
import { MaintenanceController } from "./controller.svelte";
import { MemoryMaintenancePort } from "../../catalog/memory-port";
import { snapshotFixture } from "../../catalog/fixtures";
import type {
  MaintenanceDetail,
  MaintenanceReadPort,
  MaintenanceSnapshot,
} from "./types";
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
};
const create = (
  scenario: ConstructorParameters<
    typeof MemoryMaintenancePort
  >[0] = "populated",
) => {
  const port = new MemoryMaintenancePort(scenario, 0);
  return { port, controller: new MaintenanceController(port, port) };
};
describe("maintenance read boundary", () => {
  it("prioritizes approval waits and current failures and filters all views without commands", async () => {
    const { controller, port } = create();
    await controller.refresh();
    expect(controller.items.slice(0, 2).map((i) => i.id)).toEqual([
      "approval",
      "failure",
    ]);
    controller.query = "compatibility";
    expect(controller.items.map((i) => i.id)).toEqual(["compatibility"]);
    controller.query = "";
    controller.repositories = ["lapismd/lapis-notes", "lapismd/lapis-desktop"];
    expect(controller.items).toHaveLength(4);
    controller.status = "cancelled";
    expect(controller.items.map((i) => i.id)).toEqual(["cancelled"]);
    controller.resetFilters();
    controller.view = "activity";
    expect(controller.items).toHaveLength(10);
    controller.view = "approval";
    expect(controller.items).toHaveLength(1);
    await controller.select("approval");
    expect(port.commands).toHaveLength(0);
    controller.dispose();
  });
  it("ignores out-of-order snapshots and detail responses, including after disposal", async () => {
    const first = deferred<MaintenanceSnapshot>(),
      second = deferred<MaintenanceSnapshot>();
    const a = deferred<MaintenanceDetail>(),
      b = deferred<MaintenanceDetail>();
    let reads = 0;
    const read: MaintenanceReadPort = {
      readSnapshot: () => (++reads === 1 ? first.promise : second.promise),
      readDetails: (id) => (id === "a" ? a.promise : b.promise),
    };
    const port = new MemoryMaintenancePort("populated", 0),
      c = new MaintenanceController(read, port);
    const old = c.refresh(),
      fresh = c.refresh();
    second.resolve({ ...snapshotFixture(), fetchedAt: "new" });
    await fresh;
    first.resolve({ ...snapshotFixture(), fetchedAt: "old" });
    await old;
    expect(c.snapshot?.fetchedAt).toBe("new");
    const oldDetail = c.select("a"),
      newDetail = c.select("b");
    b.resolve({
      item: { ...snapshotFixture().items[0]!, id: "b" },
      description: "B",
      checks: [],
    });
    await newDetail;
    c.dispose();
    a.resolve({
      item: { ...snapshotFixture().items[0]!, id: "a" },
      description: "A",
      checks: [],
    });
    await oldDetail;
    expect(c.detail?.item.id).toBe("b");
  });
  it("retains content on refresh failure and clears fetched state on disconnect", async () => {
    const { controller: c, port } = create();
    await c.refresh();
    port.readSnapshot = async () => {
      throw Error("offline");
    };
    await c.refresh();
    expect(c.error?.message).toBe("offline");
    expect(c.snapshot?.items).toHaveLength(10);
    c.disconnect();
    expect(c.snapshot).toBeNull();
    expect(c.selectedId).toBeNull();
    c.dispose();
  });
});
describe("explicit command boundary", () => {
  it("does not submit before confirmation, prevents double confirmation, and distinguishes accepted", async () => {
    const { controller: c, port } = create();
    await c.refresh();
    await c.select("failure");
    c.commands.prepare(c.detail!.item, "rerun-failed");
    expect(port.commands).toHaveLength(0);
    await Promise.all([c.commands.confirm(), c.commands.confirm()]);
    expect(port.commands).toHaveLength(1);
    expect(c.commands.receipts[0]?.status).toBe("accepted");
    c.dispose();
  });
  it("rejects a stale target before any write", async () => {
    const { controller: c, port } = create("stale-target");
    await c.refresh();
    await c.select("approval");
    c.commands.prepare(c.detail!.item, "approve-deployment");
    await c.commands.confirm();
    expect(port.commands).toHaveLength(0);
    expect(c.commands.receipts[0]?.message).toContain(
      "Target or permissions changed",
    );
    c.dispose();
  });
  it("blocks denied capabilities and retains uncertain outcomes without replay", async () => {
    const denied = create("permissions");
    await denied.controller.refresh();
    await denied.controller.select("approval");
    denied.controller.commands.prepare(
      denied.controller.detail!.item,
      "approve-deployment",
    );
    expect(denied.controller.commands.confirmation).toBeNull();
    denied.controller.dispose();
    const { controller: c, port } = create("uncertain");
    await c.refresh();
    await c.select("approval");
    c.commands.prepare(c.detail!.item, "approve-deployment");
    await c.commands.confirm();
    expect(c.commands.receipts[0]?.status).toBe("uncertain");
    c.commands.prepare(c.detail!.item, "approve-deployment");
    await c.commands.confirm();
    expect(port.commands).toHaveLength(1);
    c.dispose();
  });
  it("cancels pending validation on disposal without executing", async () => {
    const { controller: c, port } = create();
    await c.refresh();
    await c.select("approval");
    c.commands.prepare(c.detail!.item, "approve-deployment");
    const done = c.commands.confirm();
    c.dispose();
    await done;
    expect(port.commands).toHaveLength(0);
  });
});
