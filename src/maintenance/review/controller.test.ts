import { describe, expect, it, vi } from "vitest";
import { ReviewController } from "./controller.svelte";
import { MemoryReviewPort } from "../../../catalog/review/memory-port";
import type { ReviewResources, ReviewReadPort } from "./types";
function fixture(
  scenario: ConstructorParameters<typeof MemoryReviewPort>[0] = "ready",
) {
  const port = new MemoryReviewPort(scenario, 0);
  return { port, controller: new ReviewController(port.summaries, port, port) };
}
describe("fixture-only review controller", () => {
  it("loads optional resources lazily and never writes on selection, refresh or navigation", async () => {
    const { port, controller } = fixture();
    await controller.select("registry");
    expect(port.reads.has("registry:activity")).toBe(false);
    controller.setTab("files");
    await vi.waitFor(() => expect(controller.patch.data).toBeDefined());
    controller.fileQuery = "package";
    expect(controller.files.map((file) => file.path)).toEqual(["package.json"]);
    await controller.refresh();
    expect(port.commands).toHaveLength(0);
    controller.dispose();
  });
  it("retains content during refresh and isolates an optional-resource failure", async () => {
    const { controller } = fixture("resource-error");
    await controller.select("registry");
    const previous = controller.resources.checks.data;
    const refreshing = controller.load("checks");
    expect(controller.resources.checks.data).toBe(previous);
    expect(controller.resources.checks.loading).toBe(true);
    await refreshing;
    await controller.load("activity");
    expect(controller.resources.activity.error).toContain("Activity could not");
    expect(controller.canApprove).toBe(true);
    await controller.load("activity");
    expect(controller.resources.activity.data?.items).toHaveLength(3);
    controller.dispose();
  });
  it("appends activity pages and reopens known patches without another read", async () => {
    const { port, controller } = fixture();
    const patch = vi.spyOn(port, "patch");
    await controller.select("registry");
    await controller.load("activity");
    await controller.load("activity", controller.resources.activity.data?.next);
    expect(controller.resources.activity.data?.items).toHaveLength(5);
    await controller.load("files");
    await controller.selectFile(".changeset/quiet-lapis.md");
    await controller.selectFile("package.json");
    expect(patch).toHaveBeenCalledTimes(2);
    controller.dispose();
  });
  it("requires explicit confirmation and prevents duplicate simulated submissions", async () => {
    const { port, controller } = fixture("workflow-approval");
    await controller.select("compatibility");
    controller.prepare("approve-workflow", "fork-ci", "Approve workflow run");
    expect(port.commands).toHaveLength(0);
    const first = controller.confirm();
    await controller.confirm();
    await first;
    expect(port.commands).toHaveLength(1);
    expect(controller.feedback?.result.status).toBe("accepted");
    expect(controller.resources.approvals.data?.[0]?.state).toBe("accepted");
    controller.dispose();
  });
  it.each(["stale", "uncertain"] as const)(
    "presents %s outcomes without replay",
    async (scenario) => {
      const { port, controller } = fixture(scenario);
      await controller.select("registry");
      controller.prepare(
        "approve-environment",
        "production",
        "Approve environment",
      );
      await controller.confirm();
      expect(controller.feedback?.result.status).toBe(
        scenario === "stale" ? "rejected" : "uncertain",
      );
      if (scenario === "uncertain") {
        controller.prepare(
          "approve-environment",
          "production",
          "Approve environment",
        );
        expect(controller.confirmation).toBeNull();
      }
      expect(port.commands).toHaveLength(1);
      controller.dispose();
    },
  );
  it("keeps no-check and denied actions unavailable", async () => {
    for (const scenario of ["empty", "permission-denied"] as const) {
      const { port, controller } = fixture(scenario);
      await controller.select("registry");
      controller.prepare("approve-pr", "registry", "Approve PR");
      if (scenario === "permission-denied")
        controller.prepare(
          "approve-environment",
          "production",
          "Approve environment",
        );
      expect(controller.canApprove).toBe(false);
      expect(controller.confirmation).toBeNull();
      expect(port.commands).toHaveLength(0);
      controller.dispose();
    }
  });
  it("rejects old selection responses even when a port ignores cancellation", async () => {
    const { port } = fixture();
    let resolve!: (value: ReviewResources["checks"]) => void;
    const late = new Promise<ReviewResources["checks"]>((done) => {
      resolve = done;
    });
    const read: ReviewReadPort = {
      read: (id, resource, signal, options) =>
        id === "registry" && resource === "checks"
          ? (late as never)
          : port.read(id, resource, signal, options),
      patch: port.patch.bind(port),
    };
    const controller = new ReviewController(port.summaries, read, port);
    const previous = controller.select("registry");
    await controller.select("version");
    resolve([]);
    await previous;
    expect(controller.overview?.id).toBe("version");
    expect(controller.resources.checks.data).toHaveLength(4);
    controller.dispose();
  });
});
