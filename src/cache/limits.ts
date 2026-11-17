export const MAX_CACHE_BYTES = 25 * 1_048_576;
// Both persistent backends can coexist (for example, in separate tabs).
// Each has one shared store, so their combined payload never exceeds 25 MiB.
export const MAX_STORE_BYTES = MAX_CACHE_BYTES / 2;
export const MAX_CACHE_ENTRIES = 1000;
export const MAX_ENTRY_BYTES = 1_048_576;
export const RETENTION_MS = 86_400_000;
export const MAINTENANCE_MS = 60_000;
export const recordBytes = (key: string, value: unknown) =>
  new TextEncoder().encode(key + JSON.stringify(value)).byteLength;
