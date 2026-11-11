<script lang="ts">
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  let { controller }: { controller: MaintenanceController } = $props();
</script>

<div class="maintenance-freshness" title="Snapshot time (UTC)">
  {#if controller.snapshot}<span class="maintenance-live-dot"></span>{new Date(
      controller.snapshot.fetchedAt,
    ).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    })} UTC{:else}Fixture session{/if}
</div>
