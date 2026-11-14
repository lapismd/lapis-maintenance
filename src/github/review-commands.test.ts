import { expect, it, vi } from "vitest";
import { GithubReviewCommands } from "./review-commands";
import { retainedCommandTarget } from "./review-target";
import type {
  ReviewCommand,
  ReviewOverview,
} from "../maintenance/review/types";
import type { GithubReadPort } from "./read-port";
import type { GithubReviewPort } from "./review-port";
import type { MaintenanceController } from "../maintenance/controller.svelte";
const repository = "lapismd/maintenance",
  sha = "a".repeat(40);
const overview = {
  id: `pr:${repository}:1`,
  repository,
  sha,
  url: `https://github.com/${repository}/pull/1`,
} as ReviewOverview;
it("rehydrates an independently cached approval identity before the one authoritative command adapter", async () => {
  const command: ReviewCommand = {
    requestId: "one",
    itemId: overview.id,
    targetId: `deployment:${repository}:12:34`,
    target: {
      kind: "deployment",
      sha,
      runId: 12,
      attempt: 2,
      environmentId: 34,
    },
    sha,
    kind: "approve-environment",
    label: "Approve environment",
  };
  const reader = {
    seed: () => undefined,
    remember: vi.fn(),
  } as unknown as GithubReadPort;
  const execute = vi.fn(async () => ({
    status: "rejected" as const,
    message: "Fresh actor eligibility denied",
  }));
  const inbox = {
    commands: { receipts: [] },
    refreshAffected: vi.fn(),
  } as unknown as MaintenanceController;
  const bridge = new GithubReviewCommands(
    reader,
    { read: async () => overview } as unknown as GithubReviewPort,
    { execute },
    inbox,
  );
  const result = await bridge.execute(command, new AbortController().signal);
  expect(result.status).toBe("rejected");
  expect(reader.remember).toHaveBeenCalledWith(
    expect.objectContaining({
      checks: [],
      item: expect.objectContaining({
        id: command.targetId,
        target: command.target,
        actions: [],
      }),
    }),
  );
  expect(execute).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({
      itemId: command.targetId,
      target: command.target,
      kind: "approve-deployment",
    }),
    expect.any(AbortSignal),
  );
});
it("restores routed PR identity and refuses cross-repository or malformed cached targets", () => {
  const command: ReviewCommand = {
    requestId: "two",
    itemId: overview.id,
    targetId: overview.id,
    target: { kind: "pull-request", sha },
    sha,
    kind: "merge-pr",
    label: "Merge",
  };
  expect(retainedCommandTarget(command, overview)?.item.number).toBe(1);
  expect(
    retainedCommandTarget(
      { ...command, targetId: "pr:another/repository:1" },
      overview,
    ),
  ).toBeUndefined();
  expect(
    retainedCommandTarget(
      {
        ...command,
        targetId: `run:${repository}:99`,
        target: { kind: "workflow", sha, runId: 12, attempt: 2 },
      },
      overview,
    ),
  ).toBeUndefined();
});
