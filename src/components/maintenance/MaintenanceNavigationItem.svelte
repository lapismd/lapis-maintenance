<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import { operationsScope } from "../../maintenance/operations";
  import type { Inbox } from "@lucide/svelte";
  import type { AppShellController } from "@lapismd/design-core/shell";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  import type { View } from "../../maintenance/types";
  let {
    entry,
    controller,
    shell,
    compact,
    onNavigate,
  }: {
    entry: { id: View; label: string; icon: typeof Inbox };
    controller: MaintenanceController;
    shell: AppShellController;
    compact: boolean;
    onNavigate?: (view: View) => void;
  } = $props();
  const countId = $props.id();
  const scope = $derived(
    operationsScope(
      controller.snapshot,
      controller.reports.evidence ?? controller.snapshot?.coordinator,
      controller.repositories,
      controller.repositoryStatuses,
      controller.query,
    ),
  );
  const count = $derived(scope.attention.length + scope.issues.length);
</script>

<div class="maintenance-navigation-entry">
  <Tooltip.Root disabled={!compact}>
    <Tooltip.Trigger>
      {#snippet child({ props })}
        <Button
          {...props}
          variant="ghost"
          aria-label={entry.label}
          aria-busy={entry.id === "operations"
            ? controller.reports.loading
            : undefined}
          aria-describedby={entry.id === "operations" && count > 0
            ? countId
            : undefined}
          title={entry.id === "operations"
            ? `${count} items need attention`
            : undefined}
          style="position:relative"
          aria-current={controller.view === entry.id ? "page" : undefined}
          onclick={() => {
            controller.view = entry.id;
            onNavigate?.(entry.id);
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
  {#if entry.id === "operations" && count > 0}<Badge
      id={countId}
      variant="default"
      role="img"
      aria-label={`${count} items need attention`}
      class="operations-nav-count"
      data-compact={compact}>{count}</Badge
    >{/if}
</div>

<style>
  .maintenance-navigation-entry {
    position: relative;
    min-width: 0;
  }
  :global(.operations-nav-count) {
    pointer-events: none;
    position: absolute;
    inset-inline-end: 0.65rem;
    inset-block-start: 50%;
    transform: translateY(-50%);
    --ui-badge-background: color-mix(
      in srgb,
      var(--foreground) 6%,
      var(--background)
    );
    --ui-badge-foreground: var(--muted-foreground);
  }
  :global(.operations-nav-count[data-compact="true"]) {
    position: absolute;
    inset-block-start: 0;
    inset-inline-end: 0;
    transform: none;
    font-size: 0.6rem;
    padding: 0 0.2rem;
    min-width: 0.9rem;
  }
</style>
