<script lang="ts">
  import * as InputGroup from "@lapismd/design-core/shadcn/input-group";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Select from "@lapismd/design-core/shadcn/select";
  import { Search } from "@lucide/svelte";
  import RepositoryFilter from "./RepositoryFilter.svelte";
  import { statusLabels, type ItemStatus } from "../../maintenance/types";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  let { controller }: { controller: MaintenanceController } = $props();
  const statuses = Object.entries(statusLabels) as [ItemStatus, string][];
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
  <Select.Root
    type="single"
    value={controller.status || "all"}
    onValueChange={(v) =>
      (controller.status = v === "all" ? "" : (v as ItemStatus))}
  >
    <Select.Trigger aria-label="Filter status"
      >{controller.status
        ? statusLabels[controller.status]
        : "All statuses"}</Select.Trigger
    >
    <Select.Content
      ><Select.Item value="all">All statuses</Select.Item
      >{#each statuses as [value, label]}<Select.Item {value}
          >{label}</Select.Item
        >{/each}</Select.Content
    >
  </Select.Root>
  {#if controller.query || controller.repositories.length || controller.status}<Button
      size="sm"
      variant="ghost"
      onclick={() => controller.resetFilters()}>Clear filters</Button
    >{/if}
</div>
