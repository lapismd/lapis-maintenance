import {
  MaintenanceReadError,
  type MaintenanceDetail,
} from "../maintenance/types";
import type { GithubPull, GithubRun, GithubRepository } from "./models";
import {
  GithubError,
  type GithubTransport,
  type ReadOptions,
} from "./transport";
import { readPull } from "./pull-reads";
import { readWorkflow } from "./workflow-reads";
import { loadWorkflowJobs } from "./job-reads";
import { readLinkedPull } from "./linked-pull";
import { readWorkflowApprovals } from "./workflow-approvals";
export async function readItemDetails(
  client: GithubTransport,
  existing: MaintenanceDetail | undefined,
  signal: AbortSignal,
  hold?: string,
  actor?: string,
  options: ReadOptions = {},
): Promise<MaintenanceDetail> {
  if (!existing)
    throw new MaintenanceReadError(
      "The item is no longer in the current snapshot. Refresh to check its state.",
    );
  const item = existing.item;
  const access = actor
    ? {
        login: actor,
        repository: await client.read<GithubRepository>(
          `/repos/${item.repository}`,
          signal,
          options,
        ),
      }
    : undefined;
  if (item.kind === "pull-request") {
    const pr = await client.read<GithubPull>(
      `/repos/${item.repository}/pulls/${item.number}`,
      signal,
      options,
    );
    const detail = await readPull(
      client,
      item.repository,
      pr,
      signal,
      options,
      hold,
      access,
    );
    if (access) {
      try {
        await readWorkflowApprovals(client, detail, signal, options, access);
      } catch (error) {
        signal.throwIfAborted();
        if (error instanceof GithubError && error.status === 401) throw error;
        detail.coverage = [
          ...(detail.coverage ?? []),
          "Workflow approval coverage unavailable.",
        ];
      }
    }
    return detail;
  }
  if (item.target.kind === "workflow" || item.target.kind === "deployment") {
    const run = await client.read<GithubRun>(
      `/repos/${item.repository}/actions/runs/${item.target.runId}`,
      signal,
      options,
    );
    const details = await readWorkflow(
      client,
      item.repository,
      run,
      signal,
      options,
      access,
    );
    await loadWorkflowJobs(
      client,
      details,
      item.repository,
      run,
      signal,
      options,
    );
    const match = details.find((detail) => detail.item.id === item.id);
    if (match) {
      try {
        match.pullRequest = await readLinkedPull(
          client,
          item.repository,
          run,
          signal,
          hold,
          access,
          options,
        );
      } catch (error) {
        signal.throwIfAborted();
        if (error instanceof GithubError && error.status === 401) throw error;
        match.coverage = [
          ...(match.coverage ?? []),
          "Associated PR details unavailable.",
        ];
      }
      return match;
    }
  }
  throw new MaintenanceReadError(
    "This approval or workflow is no longer available. Refresh the inbox.",
  );
}
