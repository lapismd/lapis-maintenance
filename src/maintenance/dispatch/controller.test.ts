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
it("requires an explicit ref, captures immutable inputs on submission and prevents duplicates", async () => {
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
  await controller.submit();
  expect(execute).not.toHaveBeenCalled();
  await controller.select("1", target.ref.ref);
  expect(execute).not.toHaveBeenCalled();
  const submitting = controller.submit();
  await controller.submit();
  await submitting;
  expect(execute).toHaveBeenCalledOnce();
  expect(controller.result?.status).toBe("accepted");
  await controller.submit();
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
  const sending = controller.submit();
  controller.dispose();
  resolve({ status: "accepted", message: "Late" });
  await sending;
  expect(controller.result).toBeNull();
});

it("retains dispatch inputs on a definite rejection and retries only on explicit submission", async () => {
  const definition = {
    ...target,
    inputs: [
      {
        name: "message",
        description: "Workflow message",
        type: "string" as const,
        required: true,
      },
    ],
  };
  const execute = vi
    .fn()
    .mockResolvedValueOnce({
      status: "rejected",
      message: "Permission changed",
    })
    .mockResolvedValueOnce({ status: "accepted", message: "Accepted" });
  const controller = new DispatchController({
    discover: async () => ({
      workflows: [target.workflow],
      refs: [target.ref],
      warnings: [],
    }),
    target: async () => definition,
    execute,
  });
  await controller.show("a/b");
  await controller.select("1", target.ref.ref);
  controller.values = { message: "Keep this input" };
  await controller.submit();
  expect(controller.result).toBeNull();
  expect(controller.error).toBe("Permission changed");
  expect(controller.values.message).toBe("Keep this input");
  expect(execute).toHaveBeenCalledOnce();
  await controller.submit();
  expect(execute).toHaveBeenCalledTimes(2);
  expect(execute.mock.calls[1]?.[0].requestId).not.toBe(
    execute.mock.calls[0]?.[0].requestId,
  );
  expect(execute.mock.calls[1]?.[0].inputs.workflowInputs.message).toBe(
    "Keep this input",
  );
  controller.dispose();
});
