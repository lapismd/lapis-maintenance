import type { CachedResponse, ResponseCache } from "./response-cache";
import { retainResponse } from "./retention-policy";
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

/** Remove obsolete app-owned file caches left by versions before IndexedDB. */
export async function cleanLegacyFileCaches() {
  if (!navigator.storage?.getDirectory) return;
  const root = await navigator.storage.getDirectory();
  const iterable = root as FileSystemDirectoryHandle & {
    entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
  };
  for await (const [name, handle] of iterable.entries()) {
    if (
      handle.kind !== "file" ||
      !/^lapis-maintenance-[a-f0-9]{64}\.db(?:-wal)?$/.test(name)
    )
      continue;
    await root.removeEntry(name).catch(() => {});
  }
}
