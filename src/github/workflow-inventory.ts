import type { GithubPull, GithubRun } from "./models";
import {
  GithubError,
  type GithubTransport,
  type ReadOptions,
} from "./transport";
/** Query actionable revisions, not every historical branch in the repository. */
export async function readWorkflowInventory(
  client: GithubTransport,
  repository: string,
  defaultBranch: string,
  prs: GithubPull[],
  signal: AbortSignal,
  options: ReadOptions,
) {
  const heads = new Set(prs.map((pr) => pr.head.sha));
  const gaps: string[] = [];
  try {
    const current = await client.read<{ sha: string }>(
      `/repos/${repository}/commits/${encodeURIComponent(defaultBranch)}`,
      signal,
      options,
    );
    heads.add(current.sha);
  } catch (error) {
    signal.throwIfAborted();
    if (error instanceof GithubError && error.status === 401) throw error;
    gaps.push(
      `Default branch ${defaultBranch}: ${error instanceof Error ? error.message : "Revision unavailable."}`,
    );
  }
  const queries = [
    ...[...heads].map((sha) => ({
      query: `head_sha=${encodeURIComponent(sha)}`,
      matches: (run: GithubRun) => run.head_sha === sha,
    })),
    {
      query: "status=waiting",
      matches: (run: GithubRun) => run.status === "waiting",
    },
    {
      query: "status=action_required",
      matches: (run: GithubRun) => run.conclusion === "action_required",
    },
  ];
  const results = await Promise.allSettled(
    queries.map(async (query) => {
      const runs = await client.pages<GithubRun>(
        `/repos/${repository}/actions/runs?${query.query}&per_page=100`,
        signal,
        options,
        "workflow_runs",
      );
      return runs.filter(query.matches);
    }),
  );
  signal.throwIfAborted();
  const runs = new Map<number, GithubRun>();
  results.forEach((result, index) => {
    if (result.status === "fulfilled")
      for (const run of result.value) runs.set(run.id, run);
    else {
      if (result.reason instanceof GithubError && result.reason.status === 401)
        throw result.reason;
      gaps.push(
        `Workflow coverage (${queries[index]!.query}): ${result.reason instanceof Error ? result.reason.message : "Unavailable."}`,
      );
    }
  });
  return { runs: [...runs.values()], gaps };
}
