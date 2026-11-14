<script lang="ts">
  import { AppShell, useAppShell } from "@lapismd/design-core/shell";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import * as Collapsible from "@lapismd/design-core/shadcn/collapsible";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import { ChevronDown, ChevronUp, RefreshCw, Funnel } from "@lucide/svelte";
  import type { Snippet } from "svelte";
  import MaintenanceContext from "./MaintenanceContext.svelte";
  import MaintenanceFreshness from "./MaintenanceFreshness.svelte";
  import MaintenanceFilters from "./MaintenanceFilters.svelte";
  import MaintenanceStatus from "./MaintenanceStatus.svelte";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  let {
    controller,
    title,
    sessionMode = "demo",
    cacheLabel = "",
    notice = "",
    settings,
    context,
    onRefresh,
    refreshing,
    messages,
  }: {
    controller: MaintenanceController;
    title: string;
    sessionMode?: "demo" | "github";
    cacheLabel?: string;
    notice?: string;
    settings?: Snippet;
    context?: Snippet<[Snippet]>;
    onRefresh?: () => void | Promise<void>;
    refreshing?: boolean;
    messages?: string[];
  } = $props();
  let searchOpen = $state(false);
  const searchId = $props.id();
  const shell = useAppShell();
  const refreshBusy = $derived(refreshing ?? controller.phase === "refreshing");
  const mobile = $derived(shell.mobile.resolvedMode === "mobile");
  let mobileExpanded = $state(false);
  let desktopExpanded = $state(true);
  const controlsOpen = $derived(mobile ? mobileExpanded : desktopExpanded);
  const disclosureLabel = $derived(
    controlsOpen ? "Collapse dashboard controls" : "Expand dashboard controls",
  );
</script>

{#snippet searchToggle()}<Button
    size="icon-sm"
    variant={searchOpen ? "default" : "ghost"}
    aria-label={searchOpen
      ? "Hide search and filters"
      : "Show search and filters"}
    aria-pressed={searchOpen}
    aria-expanded={searchOpen}
    aria-controls={searchId}
    title={searchOpen ? "Hide search and filters" : "Show search and filters"}
    onclick={() => (searchOpen = !searchOpen)}
    ><Funnel aria-hidden="true" /></Button
  >{/snippet}
<AppShell.Toolbar class="maintenance-toolbar"
  ><Tooltip.Provider
    ><Collapsible.Root
      class="maintenance-toolbar-content"
      style={context ? "gap:0.25rem" : undefined}
      open={controlsOpen}
      onOpenChange={(open) => {
        if (mobile) mobileExpanded = open;
        else desktopExpanded = open;
      }}
    >
      <div class="maintenance-toolbar-row">
        {#if !controlsOpen}<h1 class="maintenance-sr-only">{title}</h1>{/if}
        <AppShell.Sidebar.Toggle side="left" />
        <div class="maintenance-breadcrumb" title={`LapisMD / ${title}`}>
          <span class="maintenance-breadcrumb-brand">LapisMD</span><span
            class="maintenance-breadcrumb-divider"
            aria-hidden="true">/</span
          >
          <span class="maintenance-breadcrumb-current">{title}</span>
        </div>
        <MaintenanceStatus
          {controller}
          {notice}
          {messages}
        />{@render settings?.()}<MaintenanceFreshness {controller} /><Badge
          variant="secondary">{sessionMode === "demo" ? "Demo" : "Live"}</Badge
        >
        <Button
          size="icon-sm"
          variant="ghost"
          style="color:var(--muted-foreground)"
          aria-label={refreshBusy ? "Refreshing" : "Refresh"}
          title={refreshBusy ? "Refreshing…" : "Refresh"}
          disabled={!controller.connected ||
            controller.phase === "loading" ||
            refreshBusy}
          onclick={() => (onRefresh ? onRefresh() : controller.refresh(true))}
          ><RefreshCw size={15} aria-hidden="true" /></Button
        >
        <Collapsible.Trigger>
          {#snippet child({ props: triggerProps })}
            <Tooltip.Root>
              <Tooltip.Trigger {...triggerProps}>
                {#snippet child({ props })}
                  <Button
                    {...props}
                    size="icon-sm"
                    variant="ghost"
                    style="color:var(--muted-foreground)"
                    aria-label={disclosureLabel}
                  >
                    {#if controlsOpen}<ChevronUp
                        aria-hidden="true"
                      />{:else}<ChevronDown aria-hidden="true" />{/if}
                  </Button>
                {/snippet}
              </Tooltip.Trigger>
              <Tooltip.Content>{disclosureLabel}</Tooltip.Content>
            </Tooltip.Root>
          {/snippet}
        </Collapsible.Trigger>
        <AppShell.Sidebar.Toggle side="right" />
      </div>
      <Collapsible.Content
        class="maintenance-toolbar-details"
        data-filter-layout={controller.connected && !context}
        data-filters-open={searchOpen}
      >
        {#if context}{@render context(searchToggle)}{:else}<MaintenanceContext
            {controller}
            {title}
            actions={searchToggle}
          />{/if}
        {#if cacheLabel}<p class="maintenance-cache-label">
            {cacheLabel}
          </p>{/if}
        {#if controller.connected}<div
            class="maintenance-fixed-filters"
            id={searchId}
            hidden={!searchOpen}
          >
            <MaintenanceFilters {controller} />
          </div>{/if}
      </Collapsible.Content>
    </Collapsible.Root></Tooltip.Provider
  ></AppShell.Toolbar
>
