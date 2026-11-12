import { readCachedDetail } from "../cache/detail-cache";
import type { ResponseCache } from "../cache/response-cache";
import type { RepositorySelection } from "../github/models";
import {
  MaintenanceReadError,
  type MaintenanceReadPort,
  type MaintenanceCommandPort,
  type MaintenanceSnapshot,
  type MaintenanceItem,
  type MaintenanceDetail,
} from "../maintenance/types";

const pending = "Reconnecting to GitHub. Cached data is read-only.";
function readonlyItem(item: MaintenanceItem): MaintenanceItem {
  return {
    ...item,
    actions: item.actions.map((action) => ({
      ...action,
      available: false,
      reason: pending,
    })),
  };
}
function readonlyDetail(detail: MaintenanceDetail): MaintenanceDetail {
  return {
    ...detail,
    item: readonlyItem(detail.item),
    pullRequest: detail.pullRequest && readonlyDetail(detail.pullRequest),
    workflowApprovals: detail.workflowApprovals?.map(readonlyItem),
  };
}
/** Host-owned gate: cached presentation is independent of live provider authority. */
export class RestorePorts
  implements MaintenanceReadPort, MaintenanceCommandPort
{
  #read?: MaintenanceReadPort;
  #write?: MaintenanceCommandPort;
  constructor(
    private preview: MaintenanceSnapshot | null,
    private cache: ResponseCache,
    private selection: RepositorySelection,
  ) {}
  attach(read: MaintenanceReadPort, write: MaintenanceCommandPort) {
    this.#read = read;
    this.#write = write;
    this.preview = null;
  }
  readSnapshot: MaintenanceReadPort["readSnapshot"] = async (
    signal,
    options,
  ) => {
    signal.throwIfAborted();
    if (this.#read) return this.#read.readSnapshot(signal, options);
    if (!this.preview) throw new MaintenanceReadError(pending);
    return { ...this.preview, items: this.preview.items.map(readonlyItem) };
  };
  readDetails: MaintenanceReadPort["readDetails"] = async (
    id,
    signal,
    options,
  ) => {
    signal.throwIfAborted();
    if (this.#read) return this.#read.readDetails(id, signal, options);
    if (options?.fresh) throw new MaintenanceReadError(pending);
    const item = this.preview?.items.find((item) => item.id === id);
    if (!item) throw new MaintenanceReadError(pending);
    const cached = await readCachedDetail(
      this.cache,
      this.selection,
      id,
      item.target,
      Date.now(),
    );
    signal.throwIfAborted();
    return readonlyDetail(
      cached?.detail ?? { item, checks: [], description: pending },
    );
  };
  refreshRepository: MaintenanceReadPort["refreshRepository"] = async (
    repo,
    signal,
  ) => {
    signal.throwIfAborted();
    if (!this.#read) throw new MaintenanceReadError(pending);
    return this.#read.refreshRepository(repo, signal);
  };
  execute: MaintenanceCommandPort["execute"] = async (command) =>
    this.#write
      ? this.#write.execute(command)
      : { status: "rejected", message: pending };
}
