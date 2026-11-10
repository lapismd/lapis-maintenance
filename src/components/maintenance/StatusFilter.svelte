<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import * as CommandView from "@lapismd/design-core/shadcn/command-view";
  import { Check, ChevronDown, ListFilter } from "@lucide/svelte";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  import { statusLabels, type ItemStatus } from "../../maintenance/types";
  let {
    controller,
    compact = false,
  }: { controller: MaintenanceController; compact?: boolean } = $props();
  const label = $derived(
    controller.statuses.length === 0
      ? "All statuses"
      : controller.statuses.length === 1
        ? statusLabels[controller.statuses[0]!]
        : `${controller.statuses.length} statuses`,
  );
</script>

<Popover.Root>
  <Popover.Trigger>
    {#snippet child({ props })}
      <Button
        {...props}
        variant={compact ? "ghost" : "outline"}
        size={compact ? "icon-sm" : "default"}
        aria-label={`Filter statuses: ${label}`}
      >
        {#if compact}<ListFilter
            size={18}
            aria-hidden="true"
          />{:else}{label}<ChevronDown size={14} aria-hidden="true" />{/if}
      </Button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content
    align="start"
    side={compact ? "right" : "bottom"}
    sideOffset={8}
    collisionPadding={12}
    style="width:min(22rem,calc(100vw - 2rem));padding:0.5rem"
    aria-label="Choose statuses"
  >
    <CommandView.Root label="Search statuses" loop>
      <CommandView.Input
        aria-label="Search statuses"
        placeholder="Search statuses…"
      />
      <CommandView.List aria-label="Statuses" aria-multiselectable="true">
        <CommandView.Empty>No statuses found.</CommandView.Empty>
        <CommandView.Group heading="Statuses">
          <CommandView.Item
            value="All statuses"
            onSelect={() => (controller.statuses = [])}
          >
            {#snippet child({ props })}
              <div
                {...props}
                role="option"
                aria-selected={!controller.statuses.length}
              >
                <CommandView.ItemLabel>All statuses</CommandView.ItemLabel>
                {#if !controller.statuses.length}<Check
                    size={16}
                    aria-hidden="true"
                  />{/if}
              </div>
            {/snippet}
          </CommandView.Item>
          {#each Object.entries(statusLabels) as [status, statusLabel] (status)}
            <CommandView.Item
              value={statusLabel}
              onSelect={() => {
                const value = status as ItemStatus;
                controller.statuses = controller.statuses.includes(value)
                  ? controller.statuses.filter((s) => s !== value)
                  : [...controller.statuses, value];
              }}
            >
              {#snippet child({ props })}
                <div
                  {...props}
                  role="option"
                  aria-selected={controller.statuses.includes(
                    status as ItemStatus,
                  )}
                >
                  <CommandView.ItemIcon
                    ><ListFilter
                      size={16}
                      aria-hidden="true"
                    /></CommandView.ItemIcon
                  >
                  <CommandView.ItemLabel>{statusLabel}</CommandView.ItemLabel>
                  {#if controller.statuses.includes(status as ItemStatus)}<Check
                      size={16}
                      aria-hidden="true"
                    />{/if}
                </div>
              {/snippet}
            </CommandView.Item>
          {/each}
        </CommandView.Group>
      </CommandView.List>
      <CommandView.Footer>Select multiple · Escape to close</CommandView.Footer>
    </CommandView.Root>
  </Popover.Content>
</Popover.Root>
