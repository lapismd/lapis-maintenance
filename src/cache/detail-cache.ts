import {
  targetKey,
  type MaintenanceDetail,
  type Target,
} from "../maintenance/types";
import type { RepositorySelection } from "../github/models";
import type { ResponseCache } from "./response-cache";
import { viewKey } from "./view-cache";
const key = (selection: RepositorySelection, id: string) =>
  `maintenance-detail:v2:${id.split(":")[1]}:${viewKey(selection)}:${id}`;
export async function readCachedDetail(
  cache: ResponseCache | undefined,
  selection: RepositorySelection,
  id: string,
  target: Target,
  now: number,
): Promise<{ detail: MaintenanceDetail; fetchedAt: number } | undefined> {
  const entry = await cache?.get(key(selection, id));
  if (
    !entry ||
    now - entry.fetchedAt >= 86_400_000 ||
    entry.fetchedAt > now + 60_000
  )
    return;
  const body = entry.body as
    | { schema?: number; detail?: MaintenanceDetail }
    | undefined;
  const detail = body?.detail;
  if (
    body?.schema !== 1 ||
    detail?.item?.id !== id ||
    !Array.isArray(detail.checks) ||
    targetKey(detail.item.target) !== targetKey(target)
  )
    return;
  return { detail, fetchedAt: entry.fetchedAt };
}
export async function saveCachedDetail(
  cache: ResponseCache | undefined,
  selection: RepositorySelection,
  detail: MaintenanceDetail,
  fetchedAt: number,
) {
  await cache?.put(key(selection, detail.item.id), {
    body: { schema: 1, detail },
    fetchedAt,
  });
}
