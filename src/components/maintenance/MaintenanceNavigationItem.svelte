<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import type { Inbox } from "@lucide/svelte";
  import type { AppShellController } from "@lapismd/design-core/shell";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  import type { View } from "../../maintenance/types";
  let {
    entry,
    controller,
    shell,
    compact,
  }: {
    entry: { id: View; label: string; icon: typeof Inbox };
    controller: MaintenanceController;
    shell: AppShellController;
    compact: boolean;
  } = $props();
</script>

<Tooltip.Root disabled={!compact}>
  <Tooltip.Trigger>
    {#snippet child({ props })}
      <Button
        {...props}
        variant="ghost"
        aria-label={entry.label}
        aria-current={controller.view === entry.id ? "page" : undefined}
        onclick={() => {
          controller.view = entry.id;
          shell.mobile.showMain();
        }}
      >
        <entry.icon size={18} aria-hidden="true" />{#if !compact}<span
            >{entry.label}</span
          >{/if}
      </Button>
    {/snippet}
  </Tooltip.Trigger>
  <Tooltip.Content side="right">{entry.label}</Tooltip.Content>
</Tooltip.Root>
