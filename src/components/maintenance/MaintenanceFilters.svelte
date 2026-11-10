<script lang="ts">
  import * as InputGroup from "@lapismd/design-core/shadcn/input-group";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Search, X } from "@lucide/svelte";
  import RepositoryFilter from "./RepositoryFilter.svelte";
  import StatusFilter from "./StatusFilter.svelte";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  let { controller }: { controller: MaintenanceController } = $props();
</script>

<div class="maintenance-filters" aria-label="Inbox filters">
  <div class="maintenance-search">
    <InputGroup.Root
      ><InputGroup.Addon
        ><Search size={16} aria-hidden="true" /></InputGroup.Addon
      ><InputGroup.Input
        aria-label="Search maintenance items"
        placeholder="Search repositories, updates, reasons…"
        value={controller.query}
        oninput={(event) => (controller.query = event.currentTarget.value)}
      /></InputGroup.Root
    >
  </div>
  <RepositoryFilter {controller} />
  <StatusFilter {controller} />
  {#if controller.query || controller.repositories.length || controller.statuses.length}<Button
      size="icon-sm"
      variant="ghost"
      style="border-radius:50%"
      class="maintenance-clear-filters"
      aria-label="Clear filters"
      title="Clear filters"
      onclick={() => controller.resetFilters()}
      ><X size={16} aria-hidden="true" /></Button
    >{/if}
</div>
