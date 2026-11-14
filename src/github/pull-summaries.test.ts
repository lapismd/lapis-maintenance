import { expect, it, vi } from "vitest";
import { readRepository } from "./repository-reads";
import { readPullSummaries } from "./pull-summaries";
import { GithubTransport, GithubError } from "./transport";
import { MemoryResponseCache } from "../cache/response-cache";
import type { GithubPull } from "./models";
const repository = "owner/repo",
  signal = new AbortController().signal;
function fixture(count = 20, partial = false) {
  const pulls: GithubPull[] = Array.from({ length: count }, (_, index) => ({
    state: "open",
    number: index + 1,
    title: `Dependency ${index + 1}`,
    html_url: `https://github.com/${repository}/pull/${index + 1}`,
    updated_at: "2026-11-14T10:00:00Z",
    draft: false,
    node_id: `PR_${index}`,
    head: {
      sha: (index + 1).toString(16).padStart(40, "0"),
      ref: `feature-${index}`,
    },
    base: { ref: "main" },
    labels: [],
  }));
  const send = vi.fn<typeof fetch>(async (input, init) => {
    const url = new URL(String(input)),
      path = url.pathname;
    if (path === "/graphql") {
      const { variables } = JSON.parse(String(init?.body));
      const entries = Object.entries(variables)
        .filter(([key]) => /^n\d+$/.test(key))
        .map(([key, number]) => {
          const pr = pulls.find((pr) => pr.number === number)!;
          return [
            key.replace("n", "p"),
            {
              id: pr.node_id,
              number: pr.number,
              title: pr.title,
              body: "Description",
              url: pr.html_url,
              updatedAt: pr.updated_at,
              isDraft: false,
              headRefOid: pr.head.sha,
              mergeable: "MERGEABLE",
              mergeStateStatus: "CLEAN",
              commits: {
                nodes: [
                  {
                    commit: {
                      oid: pr.head.sha,
                      statusCheckRollup: {
                        contexts: {
                          nodes: [
                            {
                              __typename: "CheckRun",
                              databaseId: pr.number,
                              name: "Types",
                              status: "COMPLETED",
                              conclusion: "SUCCESS",
                              detailsUrl: `https://github.com/${repository}/runs/${pr.number}`,
                            },
                          ],
                          pageInfo: { hasNextPage: false },
                        },
                      },
                    },
                  },
                ],
              },
              reviews: { nodes: [], pageInfo: { hasPreviousPage: false } },
            },
          ];
        });
      return Response.json({
        data: { repository: Object.fromEntries(entries) },
        ...(partial
          ? {
              errors: [
                { type: "FORBIDDEN", path: ["repository", "p1", "reviews"] },
              ],
            }
          : {}),
      });
    }
    if (path.endsWith("/pulls")) return Response.json(pulls);
    if (path.endsWith("/check-runs"))
      return Response.json({
        check_runs: [
          {
            id: 1,
            name: "Types",
            status: "completed",
            conclusion: "success",
            head_sha: path.split("/").at(-2),
            html_url: "https://github.com/owner/repo/runs/1",
          },
        ],
      });
    if (path.endsWith("/statuses") || path.endsWith("/reviews"))
      return Response.json([]);
    if (path.endsWith("/actions/runs"))
      return Response.json({ workflow_runs: [] });
    if (path.includes("/commits/"))
      return Response.json({ sha: "f".repeat(40) });
    return Response.json({
      full_name: repository,
      default_branch: "main",
      private: false,
      permissions: { push: true },
      allow_squash_merge: true,
    });
  });
  const client = new GithubTransport(
    "invented-batch",
    new MemoryResponseCache(),
    send,
  );
  return { client, send, pulls };
}
it("uses at least 50 percent fewer cold requests for 20 PRs with identical current-head classification", async () => {
  const legacy = fixture();
  vi.spyOn(legacy.client, "query").mockRejectedValue(
    new GithubError(403, "GraphQL unavailable"),
  );
  const baseline = await readRepository(
    legacy.client,
    { repository },
    signal,
    {},
    Date.now,
    "maintainer",
  );
  const batched = fixture();
  const result = await readRepository(
    batched.client,
    { repository },
    signal,
    {},
    Date.now,
    "maintainer",
  );
  expect(
    result.details.map((d) => [d.item.id, d.item.status, d.item.target]),
  ).toEqual(
    baseline.details.map((d) => [d.item.id, d.item.status, d.item.target]),
  );
  console.info(
    JSON.stringify({
      acceptance: "20-PR cold inventory",
      restRequests: legacy.send.mock.calls.length,
      batchedRequests: batched.send.mock.calls.length,
    }),
  );
  expect(batched.send.mock.calls.length).toBeLessThanOrEqual(
    legacy.send.mock.calls.length / 2,
  );
  expect(
    batched.send.mock.calls.filter(([url]) => String(url).endsWith("/graphql")),
  ).toHaveLength(1);
  expect(
    batched.send.mock.calls.filter(([url]) =>
      /\/(check-runs|statuses|reviews)\?/.test(String(url)),
    ),
  ).toHaveLength(0);
  expect(result.details).toHaveLength(20);
  legacy.client.dispose();
  batched.client.dispose();
});
it("falls back only for the PR affected by a partial GraphQL error", async () => {
  const { client, send, pulls } = fixture(3, true);
  const results = await readPullSummaries(
    client,
    repository,
    pulls,
    signal,
    {},
  );
  expect(results.every((result) => result.status === "fulfilled")).toBe(true);
  const rest = send.mock.calls.filter(
    ([url]) => !String(url).endsWith("/graphql"),
  );
  expect(rest).toHaveLength(3);
  expect(
    rest.every(
      ([url]) =>
        String(url).includes(pulls[1]!.head.sha) ||
        String(url).includes("/pulls/2/"),
    ),
  ).toBe(true);
  client.dispose();
});
it("bounds inventory batches and reuses complete cached summaries", async () => {
  const { client, send, pulls } = fixture(45);
  expect(
    await readPullSummaries(client, repository, pulls, signal, {}),
  ).toHaveLength(45);
  expect(send).toHaveBeenCalledTimes(3);
  await readPullSummaries(client, repository, pulls, signal, {});
  expect(send).toHaveBeenCalledTimes(3);
  client.dispose();
});
