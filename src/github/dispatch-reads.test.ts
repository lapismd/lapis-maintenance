import { expect, it, vi } from "vitest";
import { DispatchReads } from "./dispatch-reads";
import { GithubTransport } from "./transport";
import { MemoryResponseCache } from "../cache/response-cache";
it("links a discovered workflow to its Actions page when GitHub metadata links the YAML source", async () => {
  const repository = "org/repo",
    yaml = "on:\n  workflow_dispatch:",
    send = vi.fn<typeof fetch>(async (input) => {
      const url = new URL(String(input)),
        path = url.pathname;
      if (path.endsWith("/actions/workflows"))
        return Response.json({
          workflows: [
            {
              id: 1,
              name: "Manual",
              state: "active",
              path: ".github/workflows/manual.yml",
              html_url: `https://github.com/${repository}/blob/main/.github/workflows/manual.yml`,
            },
          ],
        });
      if (path.endsWith("/branches"))
        return Response.json([
          { name: "main", commit: { sha: "a".repeat(40) } },
        ]);
      if (path.endsWith("/tags")) return Response.json([]);
      if (path.includes("/contents/"))
        return Response.json({
          encoding: "base64",
          sha: "b".repeat(40),
          content: btoa(yaml),
          size: yaml.length,
        });
      return Response.json({ full_name: repository, default_branch: "main" });
    });
  const client = new GithubTransport(
    "invented",
    new MemoryResponseCache(),
    send,
  );
  const result = await new DispatchReads(client).discover(
    repository,
    new AbortController().signal,
  );
  expect(result.workflows).toHaveLength(1);
  expect(result.workflows[0]!.url).toBe(
    `https://github.com/${repository}/actions/workflows/manual.yml`,
  );
  client.dispose();
  await client.drain();
});
