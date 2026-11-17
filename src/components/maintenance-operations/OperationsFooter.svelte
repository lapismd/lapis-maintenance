<script lang="ts">
  import "./operations-content.css";
  import "./operations-footer.css";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import FeedbackFeed from "../feedback/FeedbackFeed.svelte";
  import { outcomeSeverity } from "../../maintenance/feedback.svelte";
  import MaintenanceActionIcon from "../maintenance/MaintenanceActionIcon.svelte";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  let {
    controller,
    sessionMode = "demo",
  }: { controller: MaintenanceController; sessionMode?: "demo" | "github" } =
    $props();
  const actions = [
    { kind: "rerun-failed" as const, label: "Rerun eligible failures" },
    { kind: "approve-run" as const, label: "Approve eligible workflows" },
    {
      kind: "approve-deployment" as const,
      label: "Approve eligible environments",
    },
  ];
</script>

<FeedbackFeed
  scope="batch-actions"
  pending={controller.commands.busy}
  notices={controller.commands.receipts.slice(-100).map((r) => ({
    id: `command:${r.command.requestId}`,
    title: `${sessionMode === "github" ? "GitHub" : "Preview"} · ${r.status}`,
    message: r.message,
    detail: `${r.command.repository} · ${r.status}: ${r.message}`,
    severity: outcomeSeverity(r.status),
  }))}
/>
<div class="operations-footer" role="region" aria-label="Batch actions">
  <div class="operations-actions">
    {#each actions as action}<Button
        title={action.label}
        variant="outline"
        size="sm"
        disabled={controller.commands.busy ||
          !controller.items.some(
            (i) =>
              i.actions.some((a) => a.kind === action.kind && a.available) &&
              !controller.commands.blocked(i, action.kind),
          )}
        onclick={() =>
          controller.commands.invokeBatch(controller.items, action.kind)}
        ><MaintenanceActionIcon
          kind={action.kind}
          pending={controller.commands.active?.kind === action.kind}
        /><span class="operations-action-label">{action.label}</span></Button
      >{/each}
  </div>
  {#if controller.commands.busy}<p role="status">
      Submitting eligible targets…
    </p>{/if}
</div>
