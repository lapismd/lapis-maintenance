import type { MaintenanceDetail } from "../maintenance/types";
import type { GithubCheck, GithubPull } from "./models";
import {
  GithubError,
  type GithubTransport,
  type ReadOptions,
} from "./transport";
import type { GithubAccess } from "./action-policy";
import { readPull } from "./pull-reads";
import { presentPull } from "./pull-presentation";
import {
  summaryQuery,
  summaryPull,
  summaryReviews,
  summaryStatuses,
  type PullSummaryNode,
} from "./pull-summary-query";
interface SummaryResult {
  data?: { repository?: Record<string, PullSummaryNode | null> | null };
  errors?: { path?: (string | number)[] }[];
}
/** Bounded aliases reduce the three-per-PR inventory reads without hiding partial coverage. */
export async function readPullSummaries(
  client: GithubTransport,
  repository: string,
  pulls: GithubPull[],
  signal: AbortSignal,
  options: ReadOptions,
  hold?: string,
  access?: GithubAccess,
): Promise<PromiseSettledResult<MaintenanceDetail>[]> {
  const results: PromiseSettledResult<MaintenanceDetail>[] = [];
  const [owner, name] = repository.split("/");
  for (let offset = 0; offset < pulls.length; offset += 20) {
    const batch = pulls.slice(offset, offset + 20);
    let response: SummaryResult | undefined;
    try {
      response = await client.query<SummaryResult>(
        repository,
        summaryQuery(batch),
        {
          owner,
          name,
          ...Object.fromEntries(
            batch.map((pr, index) => [`n${index}`, pr.number]),
          ),
        },
        signal,
        options,
      );
    } catch (error) {
      signal.throwIfAborted();
      if (
        error instanceof GithubError &&
        (error.status === 401 || error.retryAt)
      )
        throw error;
    }
    signal.throwIfAborted();
    const errors = response?.errors ?? [];
    const nodes = response?.data?.repository;
    const values = await Promise.allSettled(
      batch.map(async (pr, index) => {
        const alias = `p${index}`,
          node = nodes?.[alias];
        const commit = node?.commits?.nodes.at(-1)?.commit;
        const contexts = commit?.statusCheckRollup?.contexts;
        const affected = errors.some(
          (error) =>
            !error.path || error.path.length < 2 || error.path[1] === alias,
        );
        if (
          !node ||
          affected ||
          !node.headRefOid ||
          commit?.oid !== node.headRefOid ||
          (contexts && contexts.pageInfo.hasNextPage) ||
          !node.reviews ||
          node.reviews.pageInfo.hasPreviousPage
        )
          return readPull(
            client,
            repository,
            pr,
            signal,
            options,
            hold,
            access,
          );
        const entries = contexts?.nodes ?? [];
        if (
          entries.some((context) =>
            context.__typename === "CheckRun"
              ? typeof context.name !== "string" ||
                typeof context.status !== "string"
              : context.__typename === "StatusContext"
                ? typeof context.context !== "string" ||
                  typeof context.state !== "string"
                : true,
          )
        )
          return readPull(
            client,
            repository,
            pr,
            signal,
            options,
            hold,
            access,
          );
        const checks: GithubCheck[] = entries
          .filter((c) => c.__typename === "CheckRun")
          .map((c, n) => ({
            id: c.databaseId ?? n,
            name: c.name!,
            status: c.status!.toLowerCase(),
            conclusion: c.conclusion?.toLowerCase() ?? null,
            head_sha: node.headRefOid,
            html_url: c.detailsUrl,
          }));
        return presentPull(
          repository,
          summaryPull(pr, node),
          [
            { status: "fulfilled", value: checks },
            { status: "fulfilled", value: summaryStatuses(entries) },
            { status: "fulfilled", value: summaryReviews(node) },
          ],
          hold,
          access,
        );
      }),
    );
    results.push(...values);
  }
  return results;
}
