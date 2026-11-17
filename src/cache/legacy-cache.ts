import type { CachedResponse, ResponseCache } from "./response-cache";
import { retainResponse } from "./retention-policy";
import { SqlResponseCache } from "./sql-cache";
import { RETENTION_MS } from "./limits";
const migrating = new Set<string>();
export async function migrateRecords(
  source: ResponseCache,
  destination: ResponseCache,
) {
  const rows: [string, CachedResponse][] = [];
  await source.sweep((key, value) => {
    rows.push([key, value]);
    return value;
  });
  for (const [key, value] of rows) {
    const retained = retainResponse(key, value);
    if (retained) await destination.put(key, retained);
  }
}
export async function migrateLegacyFiles(
  partition: string,
  destination: ResponseCache,
) {
  const root = await navigator.storage.getDirectory();
  const name = `lapis-maintenance-${partition}.db`;
  try {
    await root.getFileHandle(name);
  } catch {
    return;
  }
  migrating.add(name);
  try {
    const source = await SqlResponseCache.open(name);
    try {
      await migrateRecords(source, destination);
    } finally {
      await source.close();
    }
    await root.removeEntry(name);
    await root.removeEntry(`${name}-wal`).catch(() => {});
  } finally {
    migrating.delete(name);
  }
}
/** Expired pre-v2 token files are recoverable read caches; active OPFS locks prevent deletion. */
export async function cleanLegacyFiles() {
  if (!navigator.storage?.getDirectory) return;
  const root = await navigator.storage.getDirectory();
  const iterable = root as FileSystemDirectoryHandle & {
    entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
  };
  for await (const [name, handle] of iterable.entries()) {
    if (
      handle.kind !== "file" ||
      !/^lapis-maintenance-[a-f0-9]{64}\.db$/.test(name) ||
      migrating.has(name)
    )
      continue;
    const file = await (handle as FileSystemFileHandle).getFile();
    let modified = file.lastModified;
    try {
      modified = Math.max(
        modified,
        (await (await root.getFileHandle(`${name}-wal`)).getFile())
          .lastModified,
      );
    } catch {}
    if (modified >= Date.now() - RETENTION_MS) continue;
    try {
      await root.removeEntry(name);
      await root.removeEntry(`${name}-wal`).catch(() => {});
    } catch {
      /* An older open tab may still own this file. Retry on a later sweep. */
    }
  }
}
