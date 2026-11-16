import { expect, it, vi } from "vitest";
import { MaintenanceController } from "./controller.svelte";
import { snapshotFixture } from "../../catalog/fixtures";
import type { ItemStatus, MaintenanceItem } from "./types";

it("summarizes the active repository, query, status, branch-status and view scope without reads", () => {
  const read = {
    readSnapshot: vi.fn(),
    refreshRepository: vi.fn(),
    readDetails: vi.fn(),
  };
  const execute = vi.fn();
  const controller = new MaintenanceController(read, { execute });
  const base = snapshotFixture().items[0]!;
  const item = (
    title: string,
    repository: string,
    status: ItemStatus,
    kind: MaintenanceItem["kind"] = "workflow",
  ): MaintenanceItem => ({
    ...base,
    id: title,
    title,
    repository,
    status,
    kind,
  });
  controller.snapshot = {
    fetchedAt: "2026-11-16T02:00:00Z",
    repositories: [
      {
        repository: "example/a",
        available: true,
        actions: { branch: "main", state: "failed", workflows: 1 },
      },
      {
        repository: "example/b",
        available: true,
        actions: { branch: "main", state: "passed", workflows: 1 },
      },
    ],
    items: [
      item("Build tests", "example/a", "running"),
      item("Build failure", "example/a", "failed"),
      item("Release approval", "example/a", "approval-wait", "approval"),
      item("Review package", "example/b", "review-needed", "pull-request"),
      item("Draft update", "example/b", "draft", "pull-request"),
      item("Release complete", "example/b", "passed"),
    ],
  };
  try {
    expect(controller.counts).toEqual({
      total: 6,
      approvals: 1,
      failures: 1,
      reviews: 2,
    });
    controller.repositories = ["example/a"];
    expect(controller.counts).toEqual({
      total: 3,
      approvals: 1,
      failures: 1,
      reviews: 0,
    });
    controller.query = "Build";
    expect(controller.counts).toEqual({
      total: 2,
      approvals: 0,
      failures: 1,
      reviews: 0,
    });
    controller.statuses = ["running"];
    expect(controller.counts).toEqual({
      total: 1,
      approvals: 0,
      failures: 0,
      reviews: 0,
    });
    controller.repositories = ["example/b"];
    expect(controller.counts).toEqual({
      total: 0,
      approvals: 0,
      failures: 0,
      reviews: 0,
    });
    controller.resetFilters();
    expect(controller.counts.total).toBe(6);
    controller.view = "pull-request";
    expect(controller.counts).toEqual({
      total: 2,
      approvals: 0,
      failures: 0,
      reviews: 2,
    });
    controller.view = "inbox";
    controller.repositoryStatuses = ["passed"];
    expect(controller.counts).toEqual({
      total: 3,
      approvals: 0,
      failures: 0,
      reviews: 2,
    });
    expect(read.readSnapshot).not.toHaveBeenCalled();
    expect(read.readDetails).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  } finally {
    controller.dispose();
  }
});
