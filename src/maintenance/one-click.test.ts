import { expect, it, vi } from "vitest";
import { actionInteractions, interactionFor } from "./action-interaction";
import type { ActionKind } from "./types";
import { ReviewController } from "./review/controller.svelte";
import { MaintenanceCommands } from "./commands.svelte";
import { MemoryReviewPort } from "../../catalog/review/memory-port";
import type { MaintenanceReadPort, MaintenanceItem } from "./types";

it("runs workflow approval on the first invocation and synchronously blocks duplicate clicks", async () => {
  const port = new MemoryReviewPort("workflow-approval", 0);
  const controller = new ReviewController(port.summaries, port, port);
  await controller.select("compatibility");
  const first = controller.invoke(
    "approve-workflow",
    "fork-ci",
    "Approve workflow run",
  );
  expect(controller.pending).toBe(true);
  expect(controller.draft).toBeNull();
  expect(port.commands).toHaveLength(1);
  await controller.invoke(
    "approve-workflow",
    "fork-ci",
    "Approve workflow run",
  );
  await first;
  expect(port.commands).toHaveLength(1);
  controller.dispose();
});
it("captures the chosen merge method before the one-click write", async () => {
  const port = new MemoryReviewPort("merge-options", 0);
  const controller = new ReviewController(port.summaries, port, port);
  await controller.select("registry");
  await controller.invoke("merge-pr", "registry", "Rebase and merge", {
    mergeMethod: "rebase",
  });
  expect(port.commands).toHaveLength(1);
  expect(port.commands[0]?.mergeMethod).toBe("rebase");
  expect(controller.overview?.state).toBe("merged");
  controller.dispose();
});
it("retains required comment input after a definite rejection without replaying", async () => {
  const port = new MemoryReviewPort("ready", 0);
  port.data.get("registry")!.overview.actions = [
    { kind: "comment", label: "Leave comment", available: true },
  ];
  const execute = vi
    .fn()
    .mockResolvedValue({ status: "rejected", message: "Permission changed" });
  const controller = new ReviewController(port.summaries, port, { execute });
  await controller.select("registry");
  await controller.invoke("comment", "registry", "Leave comment");
  expect(execute).not.toHaveBeenCalled();
  expect(controller.draft?.sha).toBe(controller.overview?.sha);
  await controller.submitInput("Typed comment");
  expect(execute).toHaveBeenCalledOnce();
  expect(execute.mock.calls[0]?.[0].comment).toBe("Typed comment");
  expect(controller.draft).not.toBeNull();
  expect(controller.inputResult?.status).toBe("rejected");
  await controller.submitInput("Edited comment");
  expect(execute).toHaveBeenCalledTimes(2);
  expect(execute.mock.calls[1]?.[0].requestId).not.toBe(
    execute.mock.calls[0]?.[0].requestId,
  );
  expect(execute.mock.calls[1]?.[0].target).toEqual(
    execute.mock.calls[0]?.[0].target,
  );
  controller.cancel();
  expect(execute).toHaveBeenCalledTimes(2);
  controller.dispose();
});
it("uses the same immediate policy in the maintenance controller", async () => {
  const execute = vi.fn(async () => ({
    status: "accepted" as const,
    message: "queued",
  }));
  const commands = new MaintenanceCommands(
    {} as MaintenanceReadPort,
    { execute },
    async () => {},
  );
  const item: MaintenanceItem = {
    id: "run:a/b:1",
    repository: "a/b",
    title: "CI",
    kind: "workflow",
    status: "approval-wait",
    category: "product",
    updatedAt: "now",
    url: "https://github.com/a/b/actions/runs/1",
    reasons: [],
    target: { kind: "workflow", sha: "a".repeat(40), runId: 1, attempt: 1 },
    actions: [
      { kind: "approve-run", label: "Approve workflow", available: true },
    ],
  };
  const pending = commands.invoke(item, "approve-run");
  expect(execute).toHaveBeenCalledOnce();
  expect(commands.busy).toBe(true);
  await commands.invoke(item, "approve-run");
  await pending;
  expect(execute).toHaveBeenCalledOnce();
  expect(commands.draft).toBeNull();
  commands.dispose();
});

it("blocks uncertain targets after relabeling or navigating away and back", async () => {
  const port = new MemoryReviewPort("merge-options", 0);
  const execute = vi
    .fn()
    .mockResolvedValue({ status: "uncertain", message: "Response lost" });
  const controller = new ReviewController(port.summaries, port, { execute });
  await controller.select("registry");
  await controller.invoke("merge-pr", "registry", "Squash and merge", {
    mergeMethod: "squash",
  });
  await controller.invoke("merge-pr", "registry", "Rebase and merge", {
    mergeMethod: "rebase",
  });
  await controller.select("version");
  await controller.invoke("comment", "version", "Comment");
  await controller.submitInput("Another target");
  await controller.select("registry");
  await controller.invoke("merge-pr", "registry", "Create merge commit", {
    mergeMethod: "merge",
  });
  expect(execute).toHaveBeenCalledTimes(2);
  controller.dispose();
});

it("requires input only for text and dispatch, and fails closed for unknown actions", () => {
  expect(
    Object.keys(actionInteractions).filter(
      (kind) => interactionFor(kind as ActionKind) === "input",
    ),
  ).toEqual(["request-changes", "comment", "dispatch-workflow"]);
  expect(
    Object.values(actionInteractions).filter((value) => value === "direct"),
  ).toHaveLength(10);
  expect(interactionFor("unknown" as ActionKind)).toBeUndefined();
  expect(interactionFor("constructor" as ActionKind)).toBeUndefined();
});
it("retains an uncertain comment without permitting another submit", async () => {
  const port = new MemoryReviewPort("ready", 0);
  const execute = vi.fn().mockRejectedValue(new Error("Interrupted"));
  const controller = new ReviewController(port.summaries, port, { execute });
  await controller.select("registry");
  await controller.invoke("comment", "registry", "Leave comment");
  await controller.submitInput("   ");
  expect(execute).not.toHaveBeenCalled();
  await controller.submitInput("Typed comment");
  expect(controller.inputResult?.status).toBe("uncertain");
  await controller.submitInput("Retry");
  controller.cancel();
  await controller.invoke("comment", "registry", "New label");
  expect(controller.draft).toBeNull();
  expect(execute).toHaveBeenCalledOnce();
  controller.dispose();
});
