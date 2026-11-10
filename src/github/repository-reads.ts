import type { MaintenanceDetail } from "../maintenance/types";
import type {
  RepositoryDefault,
  GithubRepository,
  GithubPull,
  GithubRun,
} from "./models";
import {
  GithubError,
  type GithubTransport,
  type ReadOptions,
} from "./transport";
import { readPull } from "./pull-reads";
import { readWorkflow } from "./workflow-reads";
import { associateRun } from "./run-association";
import { readWorkflowInventory } from "./workflow-inventory";
export async function readRepository(
  client: GithubTransport,
  entry: RepositoryDefault,
  signal: AbortSignal,
  options: ReadOptions,
  now: () => number,
  actor?: string,
) {
  const repository = entry.repository,
    root = `/repos/${repository}`;
  const metadata = await client.read<GithubRepository>(root, signal, options);
  const access = actor ? { login: actor, repository: metadata } : undefined;
  const pulls = await client
    .pages<GithubPull>(`${root}/pulls?state=open&per_page=100`, signal, options)
    .then(
      (value) => ({ status: "fulfilled" as const, value }),
      (reason) => ({ status: "rejected" as const, reason }),
    );
  signal.throwIfAborted();
  const gaps: string[] = [],
    details: MaintenanceDetail[] = [];
  const prs = pulls.status === "fulfilled" ? pulls.value : [];
  if (pulls.status === "rejected") {
    if (pulls.reason instanceof GithubError && pulls.reason.status === 401)
      throw pulls.reason;
    gaps.push("Pull requests unavailable.");
  }
  const inventory = readWorkflowInventory(
    client,
    repository,
    metadata.default_branch,
    prs,
    signal,
    options,
  ).then(
    (value) => ({ status: "fulfilled" as const, value }),
    (reason) => ({ status: "rejected" as const, reason }),
  );
  const pullResults = await Promise.allSettled(
    prs.map((pr) =>
      readPull(
        client,
        repository,
        pr,
        signal,
        options,
        entry.holdReason,
        access,
      ),
    ),
  );
  for (const result of pullResults) {
    if (result.status === "fulfilled") {
      details.push(result.value);
      gaps.push(...(result.value.coverage ?? []));
    } else {
      if (result.reason instanceof GithubError && result.reason.status === 401)
        throw result.reason;
      gaps.push(
        "A pull request's current checks or reviews could not be read.",
      );
    }
  }
  const runs = await inventory;
  if (runs.status === "fulfilled") {
    gaps.push(...runs.value.gaps);
    const latest = new Map<string, GithubRun>();
    for (const run of runs.value.runs.toSorted(
      (a, b) => b.id - a.id || b.run_attempt - a.run_attempt,
    )) {
      const key = `${run.workflow_id}:${run.head_branch}`;
      if (!latest.has(key)) latest.set(key, run);
    }
    const runResults = await Promise.allSettled(
      [...latest.values()].map(async (observedRun) => {
        const run = associateRun(observedRun, prs);
        if (!run) return [];
        const associated = run.pull_requests
          .map((value) => prs.find((pr) => pr.number === value.number))
          .filter((value) => value !== undefined);
        if (run.pull_requests.length) {
          if (!associated.some((pr) => pr.head.sha === run.head_sha)) return [];
        } else if (run.status !== "waiting") {
          const current = await client.read<{ sha: string }>(
            `${root}/commits/${encodeURIComponent(run.head_branch || metadata.default_branch)}`,
            signal,
            options,
          );
          if (current.sha !== run.head_sha) return [];
        }
        const runDetails = await readWorkflow(
          client,
          repository,
          run,
          signal,
          options,
          access,
        );
        if (
          run.pull_requests.length === 1 &&
          associated.length === 1 &&
          associated[0]!.head.sha === run.head_sha
        ) {
          const linked = details.find(
            (detail) =>
              detail.item.id === `pr:${repository}:${associated[0]!.number}`,
          );
          for (const detail of runDetails) detail.pullRequest = linked;
        }
        return runDetails;
      }),
    );
    for (const [index, result] of runResults.entries()) {
      if (result.status === "fulfilled") {
        details.push(...result.value);
        gaps.push(...result.value.flatMap((detail) => detail.coverage ?? []));
      } else {
        if (
          result.reason instanceof GithubError &&
          result.reason.status === 401
        )
          throw result.reason;
        const run = [...latest.values()][index]!;
        gaps.push(
          `Workflow ${run.name} #${run.id}, branch ${run.head_branch ?? metadata.default_branch}: ${result.reason instanceof Error ? result.reason.message : "Could not verify this run."}`,
        );
      }
    }
  } else {
    if (runs.reason instanceof GithubError && runs.reason.status === 401)
      throw runs.reason;
    gaps.push("Workflow coverage unavailable.");
  }
  signal.throwIfAborted();
  return {
    details,
    coverage: {
      repository,
      available: !gaps.length,
      reason: [...new Set(gaps)].join(" ") || undefined,
      holdReason: entry.holdReason,
    },
  };
}
