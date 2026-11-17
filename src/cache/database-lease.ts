export const DATABASE_LEASE = "lapis-maintenance-turso-v2";
/** Another tab's WASM database must use the shared bounded IndexedDB fallback immediately. */
export async function databaseLease() {
  if (!navigator.locks)
    throw new Error("Exclusive database leases are unavailable.");
  let ready!: (release: () => Promise<void>) => void,
    failed!: (error: unknown) => void;
  const acquired = new Promise<() => Promise<void>>((resolve, reject) => {
    ready = resolve;
    failed = reject;
  });
  let finish!: () => void;
  const closed = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const holding = navigator.locks.request(
    DATABASE_LEASE,
    { ifAvailable: true },
    async (lock) => {
      if (!lock) throw new Error("Another tab owns the Turso connection.");
      ready(async () => {
        finish();
        await holding;
      });
      await closed;
    },
  );
  void holding.catch(failed);
  return acquired;
}
