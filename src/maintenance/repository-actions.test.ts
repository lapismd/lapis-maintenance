import { expect, it, vi } from "vitest";
import { MaintenanceController } from "./controller.svelte";
import { MemoryMaintenancePort } from "../../catalog/memory-port";
it("filters repositories and board items by main actions independently of card status, preserves selection and clears explicitly", async () => {
  const port = new MemoryMaintenancePort("populated", 0);
  const execute = vi.fn();
  const controller = new MaintenanceController(port, { execute });
  await controller.refresh();
  const selected = port.snapshot.repositories[0]!.repository;
  controller.snapshot = {
    ...port.snapshot,
    repositories: port.snapshot.repositories.map((repo, index) => ({
      ...repo,
      actions: {
        branch: "main",
        sha: "a".repeat(40),
        state: index === 0 ? ("failed" as const) : ("passed" as const),
        workflows: 1,
      },
    })),
  };
  controller.repositoryStatuses = ["failed"];
  expect(controller.repositoryRows.map((row) => row.repository)).toEqual([
    selected,
  ]);
  expect(controller.items.length).toBeGreaterThan(0);
  expect(controller.items.every((item) => item.repository === selected)).toBe(
    true,
  );
  controller.repositoryStatuses = ["failed", "passed"];
  expect(controller.repositoryRows).toHaveLength(
    port.snapshot.repositories.length,
  );
  controller.repositories = [selected];
  controller.repositoryStatuses = ["passed"];
  expect(controller.items).toEqual([]);
  expect(controller.repositories).toEqual([selected]);
  controller.resetFilters();
  expect(controller.repositoryStatuses).toEqual([]);
  expect(execute).not.toHaveBeenCalled();
  controller.dispose();
});
it("treats legacy cached repositories as unknown rather than successful", async () => {
  const port = new MemoryMaintenancePort("populated", 0);
  for (const repository of port.snapshot.repositories)
    delete repository.actions;
  const controller = new MaintenanceController(port, port);
  await controller.refresh();
  controller.repositoryStatuses = ["unknown"];
  expect(controller.repositoryRows).toHaveLength(
    port.snapshot.repositories.length,
  );
  controller.repositoryStatuses = ["passed"];
  expect(controller.repositoryRows).toEqual([]);
  controller.dispose();
});
