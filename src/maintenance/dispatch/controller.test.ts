import { expect, it, vi } from "vitest";
import { DispatchController } from "./controller.svelte";
import type { DispatchTarget } from "./types";
const target: DispatchTarget = {
  workflow: {
    id: 1,
    name: "Verify",
    path: ".github/workflows/verify.yml",
    url: "https://github.com/a/b/actions/workflows/verify.yml",
    inputs: [],
  },
  ref: {
    kind: "branch",
    name: "main",
    ref: "refs/heads/main",
    sha: "a".repeat(40),
  },
  inputs: [],
  environments: [],
  definitionSha: "b".repeat(40),
  defaultDefinitionSha: "b".repeat(40),
};
it("requires an explicit ref and confirmation, captures immutable inputs and prevents duplicate submissions", async () => {
  const execute = vi.fn(async () => ({
      status: "accepted" as const,
      message: "Accepted",
    })),
    controller = new DispatchController({
      discover: async () => ({
        workflows: [target.workflow],
        refs: [target.ref],
        warnings: [],
      }),
      target: async () => target,
      execute,
    });
  await controller.show("a/b");
  controller.prepare();
  expect(controller.confirmation).toBeNull();
  expect(execute).not.toHaveBeenCalled();
  await controller.select("1", target.ref.ref);
  controller.prepare();
  expect(execute).not.toHaveBeenCalled();
  expect(controller.confirmation?.target.sha).toBe(target.ref.sha);
  const confirming = controller.confirm();
  await controller.confirm();
  await confirming;
  expect(execute).toHaveBeenCalledOnce();
  expect(controller.result?.status).toBe("accepted");
  controller.prepare();
  expect(controller.confirmation).toBeNull();
  controller.dispose();
});
it("does not publish a late outcome into a retired session", async () => {
  let resolve!: (value: { status: "accepted"; message: string }) => void;
  const controller = new DispatchController({
    discover: async () => ({
      workflows: [target.workflow],
      refs: [target.ref],
      warnings: [],
    }),
    target: async () => target,
    execute: () => new Promise((done) => (resolve = done)),
  });
  await controller.show("a/b");
  await controller.select("1", target.ref.ref);
  controller.prepare();
  const sending = controller.confirm();
  controller.dispose();
  resolve({ status: "accepted", message: "Late" });
  await sending;
  expect(controller.result).toBeNull();
});
