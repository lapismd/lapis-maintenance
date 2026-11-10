import type { KanbanColumnData } from "@lapismd/design-core/workspace/kanban";
import { statusLabels, type MaintenanceItem } from "./types";
const lanes = [
  {
    id: "approval",
    label: "Approval waiting",
    color: "var(--primary)",
    statuses: ["approval-wait"],
  },
  {
    id: "failed",
    label: "Failing",
    color: "var(--destructive)",
    statuses: ["failed"],
  },
  {
    id: "review",
    label: "Needs review",
    color: "var(--chart-3)",
    statuses: ["review-needed", "draft"],
  },
  {
    id: "blocked",
    label: "Blocked",
    color: "var(--muted-foreground)",
    statuses: ["blocked", "unavailable"],
  },
  {
    id: "waiting",
    label: "Activity",
    color: "var(--chart-2)",
    statuses: ["running", "cancelled", "passed"],
  },
];
export function maintenanceColumns(
  items: MaintenanceItem[],
  snapshotAt?: string,
): KanbanColumnData[] {
  return lanes.map((lane, index) => ({
    id: lane.id,
    label: lane.label,
    color: lane.color,
    primary: index === 0,
    locked: index === 0,
    isFixedPosition: true,
    cards: items
      .filter((item) => lane.statuses.includes(item.status))
      .map((item) => ({
        id: item.id,
        title: item.title,
        color: lane.color,
        tabLabel: item.repository.split("/")[1],
        summary: item.reasons.join(" "),
        tags: [item.category],
        badge: { label: "Status", value: statusLabels[item.status] },
        metadata: [
          { id: "repository", label: "Repository", value: item.repository },
          {
            id: "updated",
            label: "Updated",
            value:
              ageAtSnapshot(item.updatedAt, snapshotAt) +
              " · " +
              new Date(item.updatedAt).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "UTC",
              }) +
              " UTC",
          },
        ],
      })),
  }));
}
function ageAtSnapshot(updatedAt: string, snapshotAt?: string): string {
  const minutes = Math.max(
    0,
    Math.floor((Date.parse(snapshotAt ?? "") - Date.parse(updatedAt)) / 60_000),
  );
  if (!Number.isFinite(minutes)) return "Age unavailable";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440)
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
}
