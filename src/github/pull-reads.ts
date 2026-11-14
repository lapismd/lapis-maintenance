import { type MaintenanceDetail } from "../maintenance/types";
import {
  type GithubCheck,
  type GithubPull,
  type GithubReview,
  type GithubStatus,
} from "./models";
import { type GithubTransport, type ReadOptions } from "./transport";
import type { GithubAccess } from "./action-policy";
import { presentPull } from "./pull-presentation";
export async function readPull(
  client: GithubTransport,
  repository: string,
  pr: GithubPull,
  signal: AbortSignal,
  options: ReadOptions,
  holdReason?: string,
  access?: GithubAccess,
  includeReviews = true,
): Promise<MaintenanceDetail> {
  const root = `/repos/${repository}`;
  const results = await Promise.allSettled([
    client.pages<GithubCheck>(
      `${root}/commits/${pr.head.sha}/check-runs?filter=latest&per_page=100`,
      signal,
      options,
      "check_runs",
    ),
    client.pages<GithubStatus>(
      `${root}/commits/${pr.head.sha}/statuses?per_page=100`,
      signal,
      options,
    ),
    includeReviews
      ? client.pages<GithubReview>(
          `${root}/pulls/${pr.number}/reviews?per_page=100`,
          signal,
          options,
        )
      : Promise.resolve([] as GithubReview[]),
  ]);
  signal.throwIfAborted();
  return presentPull(repository, pr, results, holdReason, access);
}
