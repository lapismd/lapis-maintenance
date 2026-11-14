import { expect, it, vi } from "vitest";
import { GithubTransport } from "./transport";
import { readPull } from "./pull-reads";
import { loadWorkflowJobs } from "./job-reads";
import { MemoryResponseCache } from "../cache/response-cache";
import type { GithubPull, GithubRun } from "./models";
const sha = "a".repeat(40),
  signal = new AbortController().signal;
it("preserves check/status/job target links and treats skipped jobs as passed", async () => {
  const send = vi.fn<typeof fetch>(async (input) => {
    const path = new URL(String(input)).pathname;
    if (path.endsWith("/check-runs"))
      return Response.json({
        check_runs: [
          {
            id: 1,
            name: "Types",
            status: "completed",
            conclusion: "success",
            head_sha: sha,
            html_url: "https://github.com/owner/repo/runs/1",
          },
        ],
      });
    if (path.endsWith("/statuses"))
      return Response.json([
        {
          id: 2,
          context: "Coverage",
          state: "success",
          target_url: "https://example.com/coverage",
        },
      ]);
    if (path.endsWith("/reviews")) return Response.json([]);
    if (path.endsWith("/jobs"))
      return Response.json({
        jobs: [
          {
            id: 3,
            name: "Package",
            status: "completed",
            conclusion: "skipped",
            html_url: "https://github.com/owner/repo/actions/runs/12/job/3",
          },
        ],
      });
    throw Error(path);
  });
  const client = new GithubTransport(
    "invented-links",
    new MemoryResponseCache(),
    send,
  );
  const pr = {
    state: "open",
    number: 7,
    title: "Update",
    html_url: "https://github.com/owner/repo/pull/7",
    updated_at: "now",
    draft: false,
    head: { sha, ref: "feature" },
    base: { ref: "main" },
    labels: [],
  } as GithubPull;
  const detail = await readPull(client, "owner/repo", pr, signal, {});
  expect(detail.checks.map((c) => c.url)).toEqual([
    "https://github.com/owner/repo/runs/1",
    "https://example.com/coverage",
  ]);
  await loadWorkflowJobs(
    client,
    [detail],
    "owner/repo",
    {
      id: 12,
      run_attempt: 2,
      name: "CI",
      html_url: "https://github.com/owner/repo/actions/runs/12",
    } as GithubRun,
    signal,
  );
  expect(detail.checks[0]).toMatchObject({
    state: "passed",
    url: "https://github.com/owner/repo/actions/runs/12/job/3",
    workflow: "CI",
  });
  client.dispose();
});
