<script lang="ts">
  import { Inbox, ShieldCheck, CircleX, GitPullRequest } from "@lucide/svelte";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  let {
    controller,
    title,
  }: { controller: MaintenanceController; title: string } = $props();
</script>

<div class="maintenance-context">
  <h1 class="maintenance-sr-only">{title}</h1>
  <div class="maintenance-summary" aria-label="Repository summary">
    <div>
      <span>Tracked items</span><strong
        ><Inbox size={24} aria-hidden="true" />{controller.counts.total}</strong
      >
    </div>
    <div>
      <span>Approval waits</span><strong
        ><ShieldCheck size={24} aria-hidden="true" />{controller.counts
          .approvals}</strong
      >
    </div>
    <div>
      <span>Failed builds</span><strong
        ><CircleX size={24} aria-hidden="true" />{controller.counts
          .failures}</strong
      >
    </div>
    <div>
      <span>Reviews & drafts</span><strong
        ><GitPullRequest size={24} aria-hidden="true" />{controller.counts
          .reviews}</strong
      >
    </div>
  </div>
</div>
