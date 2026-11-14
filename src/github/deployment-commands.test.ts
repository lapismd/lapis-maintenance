import { expect, it, vi } from "vitest";
import { GithubCommandPort } from "./command-port";
import { GithubWriteTransport } from "./write-transport";
import { GithubTransport } from "./transport";
import { MemoryResponseCache } from "../cache/response-cache";
import type {
  MaintenanceCommand,
  MaintenanceDetail,
} from "../maintenance/types";
const sha = "a".repeat(40);
function fixture(
  kind: "approve-deployment" | "reject-deployment" = "approve-deployment",
  response = 200,
) {
  const command: MaintenanceCommand = {
    requestId: "review-one",
    repository: "owner/repo",
    itemId: "deployment:owner/repo:12:5",
    kind,
    target: {
      kind: "deployment",
      sha,
      runId: 12,
      attempt: 2,
      environmentId: 5,
    },
    inputs: { body: "Reviewed this release" },
  };
  const detail: MaintenanceDetail = {
    item: {
      id: command.itemId,
      repository: command.repository,
      title: "Production",
      kind: "approval",
      category: "release",
      status: "approval-wait",
      updatedAt: "now",
      url: "https://github.com/owner/repo/actions/runs/12",
      target: command.target,
      reasons: [],
      actions: [{ kind, label: "Review", available: true }],
    },
    description: "",
    checks: [],
    environment: "production",
  };
  const readDetails = vi.fn(async () => structuredClone(detail));
  const send = vi.fn<typeof fetch>(async () =>
    Response.json(
      response === 200
        ? []
        : { message: "Resource not accessible by personal access token" },
      {
        status: response,
        headers: { "x-accepted-github-permissions": "deployments=write" },
      },
    ),
  );
  const client = new GithubTransport(
    "invented-deploy",
    new MemoryResponseCache(),
    send,
  );
  const writer = new GithubWriteTransport("invented-deploy", send);
  const port = new GithubCommandPort(client, writer, {
    readDetails,
    readSnapshot: vi.fn(),
    refreshRepository: vi.fn(),
  });
  return { command, detail, readDetails, send, port };
}
it.each(["approve-deployment", "reject-deployment"] as const)(
  "submits %s to just the displayed pending environment after fresh validation",
  async (kind) => {
    const { command, port, send, readDetails } = fixture(kind);
    expect((await port.execute(command)).status).toBe("accepted");
    expect(readDetails).toHaveBeenCalledWith(
      command.itemId,
      expect.any(AbortSignal),
      { fresh: true },
    );
    const [url, init] = send.mock.calls[0]!;
    expect(String(url)).toBe(
      "https://api.github.com/repos/owner/repo/actions/runs/12/pending_deployments",
    );
    expect(JSON.parse(String(init?.body))).toEqual({
      environment_ids: [5],
      state: kind === "approve-deployment" ? "approved" : "rejected",
      comment: "Reviewed this release",
    });
    await port.execute(command);
    expect(send).toHaveBeenCalledOnce();
  },
);
it.each([
  "changed-attempt",
  "changed-environment",
  "lost-eligibility",
  "removed-wait",
] as const)("rejects %s without writing", async (kind) => {
  const { command, detail, port, send, readDetails } = fixture();
  if (kind === "changed-attempt")
    detail.item.target = {
      ...command.target,
      attempt: 3,
    } as typeof command.target;
  if (kind === "changed-environment")
    detail.item.target = {
      ...command.target,
      environmentId: 6,
    } as typeof command.target;
  if (kind === "lost-eligibility") detail.item.actions[0]!.available = false;
  if (kind === "removed-wait")
    readDetails.mockRejectedValue(Error("No pending environment"));
  expect((await port.execute(command)).status).toBe("rejected");
  expect(send).not.toHaveBeenCalled();
});
it("reports bounded GitHub permission diagnostics without replay", async () => {
  const { command, port, send } = fixture("approve-deployment", 403);
  const result = await port.execute(command);
  expect(result.status).toBe("rejected");
  expect(result.message).toContain("Resource not accessible");
  expect(result.message).toContain("deployments=write");
  expect(send).toHaveBeenCalledOnce();
});
it("retains uncertain deployment reviews and refuses a new request ID for the same target", async () => {
  const { command, port, send } = fixture("approve-deployment", 503);
  expect((await port.execute(command)).status).toBe("uncertain");
  expect((await port.execute({ ...command, requestId: "second" })).status).toBe(
    "rejected",
  );
  expect(send).toHaveBeenCalledOnce();
});
