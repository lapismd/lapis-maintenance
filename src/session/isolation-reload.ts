/** At most one bootstrap reload per tab, even when isolation is unavailable. */
export function claimIsolationReload(): boolean {
  try {
    const key = "lapis-maintenance:isolation-reload";
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, "1");
    return true;
  } catch {
    // A blocked store cannot guarantee a reload bound; use the memory fallback.
    return false;
  }
}
