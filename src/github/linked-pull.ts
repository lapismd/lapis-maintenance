import type { MaintenanceDetail } from "../maintenance/types";
import type { GithubPull, GithubRun } from "./models";
import type { GithubTransport, ReadOptions } from "./transport";
import { readPull } from "./pull-reads";
import type { GithubAccess } from "./action-policy";
import { associateRun } from "./run-association";
/** A workflow cannot borrow merge authority from an ambiguous or changed PR. */
export async function readLinkedPull(
  client: GithubTransport,
  repository: string,
  run: GithubRun,
  signal: AbortSignal,
  hold?: string,
  access?: GithubAccess,
  options: ReadOptions = {},
): Promise<MaintenanceDetail | undefined> {
  if (!run.pull_requests.length && run.event) {
    const prs = await client.pages<GithubPull>(
      `/repos/${repository}/pulls?state=open&per_page=100`,
      signal,
      options,
    );
    const associated = associateRun(run, prs);
    if (!associated) return;
    run = associated;
  }
  if (run.pull_requests.length !== 1) return;
  const pr = await client.read<GithubPull>(
    `/repos/${repository}/pulls/${run.pull_requests[0]!.number}`,
    signal,
    options,
  );
  if (pr.head.sha !== run.head_sha || pr.state !== "open") return;
  return readPull(client, repository, pr, signal, options, hold, access);
}
