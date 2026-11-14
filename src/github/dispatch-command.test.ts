import { expect, it, vi } from "vitest";
import { GithubCommandPort } from "./command-port";
import { GithubTransport } from "./transport";
import { GithubWriteTransport } from "./write-transport";
import { DispatchReads } from "./dispatch-reads";
import { MemoryResponseCache } from "../cache/response-cache";
import type {
  MaintenanceCommand,
  MaintenanceReadPort,
} from "../maintenance/types";
const repository = "lapismd/maintenance",
  sha = "a".repeat(40),
  blob = "b".repeat(40),
  url = `https://github.com/${repository}/actions/workflows/manual.yml`;
const yaml =
  "name: Manual\non:\n  workflow_dispatch:\n    inputs:\n      mode:\n        type: choice\n        options: [check, publish]\n        required: true\n";
function fixture() {
  let commit = sha,
    definition = blob,
    uncertain = false,
    writes = 0;
  const send = vi.fn<typeof fetch>(async (input, init) => {
    const path = new URL(String(input)).pathname;
    if (init?.method === "POST") {
      writes++;
      if (uncertain) throw Error("Interrupted");
      return new Response(null, { status: 204 });
    }
    if (path.endsWith("/actions/workflows/12/runs"))
      return Response.json({ workflow_runs: [] });
    if (path.endsWith("/actions/workflows/12"))
      return Response.json({
        id: 12,
        name: "Manual",
        path: ".github/workflows/manual.yml",
        state: "active",
        html_url: url,
      });
    if (path.includes("/contents/"))
      return Response.json({
        encoding: "base64",
        content: btoa(yaml),
        sha: definition,
        size: yaml.length,
      });
    if (path.includes("/commits/")) return Response.json({ sha: commit });
    if (path === `/repos/${repository}`)
      return Response.json({
        full_name: repository,
        default_branch: "main",
        permissions: { push: true },
      });
    throw Error(`Unexpected ${path}`);
  });
  const client = new GithubTransport(
      "invented",
      new MemoryResponseCache(),
      send,
    ),
    writer = new GithubWriteTransport("invented", send);
  const port = new GithubCommandPort(client, writer, {
    readDetails: vi.fn(),
  } as unknown as MaintenanceReadPort);
  port.dispatch = new DispatchReads(client);
  const command: MaintenanceCommand = {
    requestId: "one",
    repository,
    itemId: `dispatch:${repository}:12`,
    kind: "dispatch-workflow",
    target: {
      kind: "dispatch",
      sha,
      workflowId: 12,
      ref: "refs/heads/main",
      definitionSha: blob,
      defaultDefinitionSha: blob,
      name: "Manual",
      path: ".github/workflows/manual.yml",
      url,
    },
    inputs: { workflowInputs: { mode: "check" } },
  };
  return {
    client,
    writer,
    port,
    command,
    send,
    writes: () => writes,
    move: () => (commit = "c".repeat(40)),
    edit: () => (definition = "d".repeat(40)),
    interrupt: () => (uncertain = true),
  };
}
it("dispatches once after fresh commit/definition/input checks, preserving exact ref and honest run feedback", async () => {
  const f = fixture();
  const [a, b] = await Promise.all([
    f.port.execute(f.command),
    f.port.execute(f.command),
  ]);
  expect(a).toEqual(b);
  expect(a.status, a.message).toBe("accepted");
  expect(a.message).toContain("not been uniquely identified");
  expect(f.writes()).toBe(1);
  const call = f.send.mock.calls.find(([, init]) => init?.method === "POST")!;
  expect(JSON.parse(String(call[1]?.body))).toEqual({
    ref: "refs/heads/main",
    inputs: { mode: "check" },
  });
  f.client.dispose();
  f.writer.dispose();
});
it.each(["move", "edit"] as const)(
  "rejects changed %s before dispatch",
  async (change) => {
    const f = fixture();
    f[change]();
    expect((await f.port.execute(f.command)).status).toBe("rejected");
    expect(f.writes()).toBe(0);
    f.client.dispose();
    f.writer.dispose();
  },
);
it("rejects invalid inputs and disposed preflight before writes", async () => {
  const f = fixture();
  f.command.inputs.workflowInputs = { mode: "unsafe" };
  expect((await f.port.execute(f.command)).status).toBe("rejected");
  expect(f.writes()).toBe(0);
  const abort = new AbortController();
  abort.abort();
  expect(
    (await f.port.execute({ ...f.command, requestId: "two" }, abort.signal))
      .status,
  ).toBe("rejected");
  expect(f.writes()).toBe(0);
  f.client.dispose();
  f.writer.dispose();
});
it("never replays an uncertain dispatch, including a new request ID", async () => {
  const f = fixture();
  f.interrupt();
  const first = await f.port.execute(f.command);
  expect(first.status, first.message).toBe("uncertain");
  expect(
    (await f.port.execute({ ...f.command, requestId: "two" })).status,
  ).toBe("rejected");
  expect(f.writes()).toBe(1);
  f.client.dispose();
  f.writer.dispose();
});
