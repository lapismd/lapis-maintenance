<script lang="ts">
  import type { Snippet } from "svelte";
  import { Inbox, ShieldCheck, CircleX, GitPullRequest } from "@lucide/svelte";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  let {
    controller,
    title,
    actions,
  }: { controller: MaintenanceController; title: string; actions?: Snippet } =
    $props();
</script>

<div
  class="maintenance-context"
  class:maintenance-context-disconnected={!controller.connected}
>
  <h1 class="maintenance-sr-only">{title}</h1>
  <div class="maintenance-context-row">
    <div class="maintenance-summary" aria-label="Repository summary">
      <div>
        <span title="Tracked items">Items</span><strong
          ><Inbox size={20} aria-hidden="true" />{controller.counts
            .total}</strong
        >
      </div>
      <div>
        <span title="Approval waits">Approvals</span><strong
          ><ShieldCheck size={20} aria-hidden="true" />{controller.counts
            .approvals}</strong
        >
      </div>
      <div>
        <span title="Failed builds">Failures</span><strong
          ><CircleX size={20} aria-hidden="true" />{controller.counts
            .failures}</strong
        >
      </div>
      <div>
        <span title="Reviews and drafts">Reviews</span><strong
          ><GitPullRequest size={20} aria-hidden="true" />{controller.counts
            .reviews}</strong
        >
      </div>
    </div>
    {@render actions?.()}
  </div>
</div>
