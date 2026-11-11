<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  let { controller }: { controller: MaintenanceController } = $props();
  const detail = $derived(controller.detail);
  const actions = $derived(
    detail?.item.actions.filter(
      (action) =>
        detail.item.kind !== "pull-request" || action.kind !== "merge-pr",
    ) ?? [],
  );
  const reasons = $derived([
    ...new Set(
      actions
        .filter((action) => !action.available && action.reason)
        .map((action) => action.reason!),
    ),
  ]);
  const workflowApprovals = $derived(detail?.workflowApprovals ?? []);
</script>

{#if detail && (actions.length || workflowApprovals.length || detail.item.kind !== "pull-request")}
  <section class="maintenance-actions" aria-label="Available actions">
    {#each actions as action}
      <Button
        size="sm"
        variant={action.kind.startsWith("reject") ||
        action.kind === "cancel-run"
          ? "destructive"
          : action.kind === "merge-pr"
            ? "default"
            : "outline"}
        disabled={!action.available ||
          controller.detailLoading ||
          !!controller.detailError ||
          controller.commands.busy ||
          controller.commands.blocked(detail.item, action.kind)}
        onclick={() =>
          controller.commands.prepare(
            detail.item,
            action.kind,
            action.kind === "merge-pr" ? { mergeMethod: "squash" } : {},
          )}>{action.label}</Button
      >
    {/each}
    {#each workflowApprovals as run}
      {#each run.actions.filter((action) => action.kind === "approve-run") as action}
        <Button
          size="sm"
          variant="outline"
          aria-label={`Approve workflow run: ${run.title}`}
          disabled={!action.available ||
            controller.detailLoading ||
            !!controller.detailError ||
            controller.commands.busy ||
            controller.commands.blocked(run, action.kind)}
          onclick={() => controller.commands.prepare(run, "approve-run")}
          >Approve workflow run</Button
        >
        <p class="maintenance-muted">
          {run.title} · {run.target.kind === "workflow"
            ? `run #${run.target.runId}, attempt ${run.target.attempt}`
            : ""}
        </p>
        {#if action.reason}<p class="maintenance-muted">{action.reason}</p>{/if}
      {/each}
    {/each}
    {#each reasons as reason}<p class="maintenance-muted">{reason}</p>{/each}
    {#if actions.length === 0}<p>
        No actions are available for this state.
      </p>{/if}
  </section>
{/if}
