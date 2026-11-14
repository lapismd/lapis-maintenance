import { MaintenanceController } from "../maintenance/controller.svelte";
import { RestorePorts } from "./restore-ports";
import type { MaintenanceSnapshot } from "../maintenance/types";
import type { ResponseCache } from "../cache/response-cache";
import type { RepositorySelection } from "../github/models";
export async function previewController(
  snapshot: MaintenanceSnapshot,
  cache: ResponseCache,
  selection: RepositorySelection,
) {
  const ports = new RestorePorts(snapshot, cache, selection);
  const controller = new MaintenanceController(ports, ports);
  await controller.refresh();
  return { ports, controller };
}
import { readCachedView } from "../cache/view-cache";
export async function restorePreview(
  cache: ResponseCache,
  selection: RepositorySelection,
  current: () => boolean,
) {
  const preview = await readCachedView(cache, selection, Date.now());
  if (!preview || !current()) return;
  const result = await previewController(preview, cache, selection);
  if (!current()) {
    result.controller.dispose();
    return;
  }
  return result;
}
