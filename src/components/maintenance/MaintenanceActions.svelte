<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  let { controller }: { controller: MaintenanceController } = $props();
  const detail = $derived(controller.detail);
</script>

{#if detail}
  <section class="maintenance-actions" aria-label="Available actions">
    {#each detail.item.actions as action}
      <Button
        size="sm"
        variant={action.kind.startsWith("reject") ||
        action.kind === "cancel-run"
          ? "destructive"
          : action.kind === "merge-pr"
            ? "default"
            : "outline"}
        disabled={!action.available ||
          controller.commands.busy ||
          controller.commands.blocked(detail.item, action.kind)}
        onclick={() =>
          controller.commands.prepare(
            detail.item,
            action.kind,
            action.kind === "merge-pr" ? { mergeMethod: "squash" } : {},
          )}>{action.label}</Button
      >
      {#if !action.available}<p class="maintenance-muted">
          {action.reason}
        </p>{/if}
    {/each}
    {#if detail.item.actions.length === 0}<p>
        No actions are available for this state.
      </p>{/if}
  </section>
{/if}
