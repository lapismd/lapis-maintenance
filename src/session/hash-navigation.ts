import type { MaintenanceController } from "../maintenance/controller.svelte";
import type { View } from "../maintenance/types";
const views: View[] = [
  "inbox",
  "activity",
  "pull-request",
  "workflow",
  "approval",
];
export function bindHashNavigation(
  controller: MaintenanceController,
): () => void {
  const changed = () => {
    const view = location.hash.slice(1) as View;
    controller.view = views.includes(view) ? view : "inbox";
  };
  changed();
  window.addEventListener("hashchange", changed);
  return () => window.removeEventListener("hashchange", changed);
}
export function writeViewHash(view: View): void {
  if (location.hash !== `#${view}`) location.hash = view;
}
