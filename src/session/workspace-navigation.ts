import type { MaintenanceController } from "../maintenance/controller.svelte";
import type { ReviewController } from "../maintenance/review/controller.svelte";
import type { View } from "../maintenance/types";
import type { ReviewTab } from "../maintenance/review/types";
const views: View[] = [
  "inbox",
  "activity",
  "pull-request",
  "workflow",
  "approval",
];
const tabs: ReviewTab[] = ["overview", "checks", "activity"];
export function workspaceHash(
  inbox: MaintenanceController,
  review: ReviewController,
): string {
  const params = new URLSearchParams();
  if (inbox.repositories.length)
    params.set("repositories", inbox.repositories.join(","));
  if (inbox.statuses.length) params.set("statuses", inbox.statuses.join(","));
  if (inbox.query) params.set("q", inbox.query);
  const board = `${inbox.view}${params.size ? `?${params}` : ""}`;
  const identity = /^pr:([^:]+):(\d+)$/.exec(review.selectedId ?? "");
  if (review.workspaceOpen && identity)
    return `#pr/${encodeURIComponent(identity[1]!)}/${identity[2]}/${review.tab}?back=${encodeURIComponent(board)}`;
  return `#${board}`;
}
export function bindWorkspaceNavigation(
  inbox: MaintenanceController,
  review: ReviewController,
) {
  const changed = () => {
    const value = location.hash.slice(1),
      pr = /^pr\/([^/]+)\/(\d+)\/(overview|checks|activity)/.exec(value);
    const board = pr
      ? (new URLSearchParams(value.split("?")[1]).get("back") ?? "inbox")
      : value;
    const [view, query] = board.split("?"),
      params = new URLSearchParams(query);
    inbox.view = views.includes(view as View) ? (view as View) : "inbox";
    inbox.repositories = (params.get("repositories") ?? "")
      .split(",")
      .filter(Boolean);
    inbox.statuses = (params.get("statuses") ?? "")
      .split(",")
      .filter((v) =>
        [
          "approval-wait",
          "failed",
          "review-needed",
          "blocked",
          "draft",
          "running",
          "cancelled",
          "unavailable",
          "passed",
        ].includes(v),
      ) as typeof inbox.statuses;
    inbox.query = params.get("q") ?? "";
    if (pr) {
      const id = `pr:${decodeURIComponent(pr[1]!)}:${pr[2]}`;
      void review.select(id);
      review.workspaceOpen = true;
      if (tabs.includes(pr[3] as ReviewTab)) review.setTab(pr[3] as ReviewTab);
    } else review.close();
  };
  changed();
  window.addEventListener("hashchange", changed);
  return () => window.removeEventListener("hashchange", changed);
}
export function writeWorkspaceHash(
  inbox: MaintenanceController,
  review: ReviewController,
) {
  const hash = workspaceHash(inbox, review);
  if (location.hash !== hash) location.hash = hash;
}
