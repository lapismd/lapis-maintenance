<script lang="ts">
  import "./operations-content.css";
  import "./operations-footer.css";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import MaintenanceActionIcon from "../maintenance/MaintenanceActionIcon.svelte";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  let { controller }: { controller: MaintenanceController } = $props();
  const actions = [
    { kind: "rerun-failed" as const, label: "Rerun eligible failures" },
    { kind: "approve-run" as const, label: "Approve eligible workflows" },
    {
      kind: "approve-deployment" as const,
      label: "Approve eligible environments",
    },
  ];
</script>

<div class="operations-footer" role="region" aria-label="Batch actions">
  <div class="operations-actions">
    {#each actions as action}<Button
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
        />{action.label}</Button
      >{/each}
  </div>
  {#if controller.commands.busy}<p role="status">
      Submitting eligible targets…
    </p>{/if}
  {#if controller.commands.receipts.length}<ol aria-label="Action outcomes">
      {#each controller.commands.receipts as receipt}<li>
          {receipt.command.repository} · {receipt.command.kind} · {receipt.command.target.sha.slice(
            0,
            8,
          )}: <strong>{receipt.status}</strong> — {receipt.message}
        </li>{/each}
    </ol>{/if}
</div>
