import type { MaintenanceController } from "./controller.svelte";
import type { FeedbackNotice } from "./feedback.svelte";
import { outcomeSeverity } from "./feedback.svelte";
export function maintenanceNotices(
  controller: MaintenanceController,
  notice: string,
  messages: string[],
  mode: "demo" | "github",
  onDetails: () => void,
): FeedbackNotice[] {
  const action = { label: "View details", run: onDetails };
  const notices: FeedbackNotice[] = controller.unavailable
    .filter((row) => !row.loading)
    .map((row) => ({
      id: `repository:${row.repository}:coverage`,
      title: `Could not refresh ${row.repository}`,
      severity: "warning",
      message:
        "Some repository data is unavailable. Details are in the status log.",
      detail: `${row.repository} — ${row.reason ?? "Data unavailable."}`,
      action,
    }));
  if (controller.error)
    notices.push({
      id: "maintenance:refresh",
      title: "Could not refresh maintenance items",
      message: controller.error.message,
      severity: "error",
      action,
    });
  if (notice)
    notices.push({
      id: "session:notice",
      title: "Session notice",
      message: notice,
      severity: "info",
      action,
    });
  for (const message of messages.filter((m) =>
    /unavailable|could not|failed|HTTP|denied|error|incomplete/i.test(m),
  ))
    notices.push({
      id: `activity-coverage:${message}`,
      title: "Activity data incomplete",
      message:
        "Some activity could not be loaded. Details are in the status log.",
      detail: message,
      severity: "warning",
      action,
    });
  for (const receipt of controller.commands.receipts.slice(-100))
    notices.push({
      id: `command:${receipt.command.requestId}`,
      title: `${mode === "github" ? "GitHub" : "Preview"} · ${receipt.status}`,
      message: receipt.message,
      detail: `${receipt.command.repository} · ${receipt.status}: ${receipt.message}`,
      severity: outcomeSeverity(receipt.status),
      action,
    });
  const evidence = controller.reports.evidence;
  if (evidence && evidence.state !== "current")
    notices.push({
      id: "coordinator:coverage",
      title: "Coordinator evidence needs attention",
      message: evidence.reason,
      severity: "warning",
      action,
    });
  return notices;
}
