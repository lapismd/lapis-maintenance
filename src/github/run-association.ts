import type { GithubPull, GithubRun } from "./models";
/** GitHub may omit pull_requests on historical and current PR runs. */
export function associateRun(
  run: GithubRun,
  prs: GithubPull[],
): GithubRun | undefined {
  const matching = prs.filter(
    (pr) => pr.state === "open" && pr.head.sha === run.head_sha,
  );
  if (
    ["pull_request", "pull_request_target"].includes(run.event ?? "") &&
    !matching.length
  )
    return;
  return run.pull_requests.length
    ? run
    : { ...run, pull_requests: matching.map((pr) => ({ number: pr.number })) };
}
