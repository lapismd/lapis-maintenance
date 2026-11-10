import type { MaintenanceController } from "../maintenance/controller.svelte";
/** The host owns the timer; hidden tabs do no periodic network work. */
export function startVisibleRefresh(
  controller: MaintenanceController,
  page: Pick<
    Document,
    "visibilityState" | "addEventListener" | "removeEventListener"
  > = document,
) {
  let lastRefresh = Date.now();
  const refresh = () => {
    if (
      page.visibilityState !== "visible" ||
      Date.now() - lastRefresh < 300_000 ||
      ["loading", "refreshing"].includes(controller.phase)
    )
      return;
    lastRefresh = Date.now();
    void controller.refresh();
  };
  const timer = setInterval(refresh, 300_000);
  page.addEventListener("visibilitychange", refresh);
  return () => {
    clearInterval(timer);
    page.removeEventListener("visibilitychange", refresh);
  };
}
