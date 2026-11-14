import {
  MaintenanceReadError,
  type MaintenanceCommand,
  type MaintenanceDetail,
  type MaintenanceItem,
} from "../maintenance/types";
import type { GithubPull, GithubRepository, GithubRun } from "./models";
import type { GithubTransport } from "./transport";
import { presentPull } from "./pull-presentation";
import { readPull } from "./pull-reads";
import { readWorkflow } from "./workflow-reads";
/** Fetch only authority needed by this action; optional resources never gate an unrelated write. */
export async function readCommandTarget(
  client: GithubTransport,
  item: MaintenanceItem,
  actor: string,
  hold: string | undefined,
  command: MaintenanceCommand,
  signal: AbortSignal,
): Promise<MaintenanceDetail> {
  if (item.repository !== command.repository || item.id !== command.itemId)
    throw new MaintenanceReadError(
      "Command repository or item identity changed.",
    );
  const options = { fresh: true, priority: "interactive" as const };
  const metadata = await client.read<GithubRepository>(
    `/repos/${item.repository}`,
    signal,
    options,
  );
  const access = { login: actor, repository: metadata };
  if (
    item.kind === "pull-request" &&
    item.number &&
    command.target.kind === "pull-request"
  ) {
    const pull = await client.read<GithubPull>(
      `/repos/${item.repository}/pulls/${item.number}`,
      signal,
      options,
    );
    if (command.kind === "approve-pr")
      return readPull(
        client,
        item.repository,
        pull,
        signal,
        options,
        hold,
        access,
        false,
      );
    return presentPull(
      item.repository,
      pull,
      [
        { status: "fulfilled", value: [] },
        { status: "fulfilled", value: [] },
        { status: "fulfilled", value: [] },
      ],
      hold,
      access,
    );
  }
  if (
    command.target.kind === "workflow" ||
    command.target.kind === "deployment"
  ) {
    const run = await client.read<GithubRun>(
      `/repos/${item.repository}/actions/runs/${command.target.runId}`,
      signal,
      options,
    );
    const values = await readWorkflow(
      client,
      item.repository,
      run,
      signal,
      options,
      access,
    );
    const detail = values.find((value) => value.item.id === command.itemId);
    if (detail) return detail;
  }
  throw new MaintenanceReadError(
    "The identified workflow or pending environment is no longer available.",
  );
}
