import { expect, it, vi } from "vitest";
import { MemoryResponseCache } from "../cache/response-cache";
import { readRepository } from "./repository-reads";
import { GithubTransport } from "./transport";

const sha = "97b2dac866bb0535ef29ad301f1f0b8dee653a7d";
const queueBranch =
  "gh-readonly-queue/main/pr-18-cb1b106a0c71a1b61b72e6f0fff3f510c9683ccc";

it("uses the current default revision after GitHub deletes a completed merge-queue ref", async () => {
  const send = vi.fn<typeof fetch>(async (input) => {
    const url = new URL(String(input));
    const path = decodeURIComponent(url.pathname);
    if (path === "/repos/lapismd/lapis-ai")
      return Response.json({
        full_name: "lapismd/lapis-ai",
        default_branch: "main",
      });
    if (path.endsWith("/pulls") || path.endsWith("/issues"))
      return Response.json([]);
    if (path.endsWith("/commits/main")) return Response.json({ sha });
    if (path.endsWith("/actions/runs"))
      return Response.json({
        workflow_runs: [
          {
            id: 44384176083,
            workflow_id: 386615568,
            event: "merge_group",
            name: "Publish specification to GitHub Pages",
            display_title: "Publish specification to GitHub Pages",
            html_url:
              "https://github.com/lapismd/lapis-ai/actions/runs/44384176083",
            head_sha: sha,
            head_branch: queueBranch,
            run_attempt: 1,
            status: "completed",
            conclusion: "success",
            updated_at: "2026-11-18T19:48:43Z",
            pull_requests: [],
          },
        ],
      });
    if (path.endsWith(`/commits/${queueBranch}`))
      return Response.json(
        { message: `No commit found for SHA: ${queueBranch}` },
        { status: 422 },
      );
    throw new Error(`Unexpected GitHub read: ${url.pathname}${url.search}`);
  });
  const client = new GithubTransport(
    "invented-test-token",
    new MemoryResponseCache(),
    send,
  );
  const result = await readRepository(
    client,
    { repository: "lapismd/lapis-ai" },
    new AbortController().signal,
    {},
    () => Date.parse("2026-11-20T14:51:19Z"),
  );
  expect(result.coverage.available).toBe(true);
  expect(result.details).toEqual([]);
  expect(
    send.mock.calls.some(([input]) =>
      decodeURIComponent(String(input)).includes(queueBranch),
    ),
  ).toBe(false);
});
