<script lang="ts">
  import { AppShell, useAppShell } from "@lapismd/design-core/shell";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import * as Collapsible from "@lapismd/design-core/shadcn/collapsible";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import { ChevronDown, ChevronUp, RefreshCw } from "@lucide/svelte";
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
  }: {
    controller: MaintenanceController;
    title: string;
    sessionMode?: "demo" | "github";
    cacheLabel?: string;
    notice?: string;
    settings?: Snippet;
  } = $props();
  const shell = useAppShell();
  const mobile = $derived(shell.mobile.resolvedMode === "mobile");
  let mobileExpanded = $state(false);
  let desktopExpanded = $state(true);
  const controlsOpen = $derived(mobile ? mobileExpanded : desktopExpanded);
  const disclosureLabel = $derived(
    controlsOpen ? "Collapse dashboard controls" : "Expand dashboard controls",
  );
</script>

<AppShell.Toolbar
  ><Tooltip.Provider
    ><Collapsible.Root
      class="maintenance-toolbar-content"
      open={controlsOpen}
      onOpenChange={(open) => {
        if (mobile) mobileExpanded = open;
        else desktopExpanded = open;
      }}
    >
      <div class="maintenance-toolbar-row">
        {#if !controlsOpen}<h1 class="maintenance-sr-only">{title}</h1>{/if}
        <AppShell.Sidebar.Toggle side="left" />
        <div class="maintenance-breadcrumb">
          LapisMD <span>/</span>
          {title}
        </div>
        <MaintenanceStatus
          {controller}
          {notice}
        />{@render settings?.()}<MaintenanceFreshness {controller} /><Badge
          variant="secondary">{sessionMode === "demo" ? "Demo" : "Live"}</Badge
        >
        <Button
          size="icon-sm"
          variant="ghost"
          style="color:var(--muted-foreground)"
          aria-label={controller.phase === "refreshing"
            ? "Refreshing"
            : "Refresh"}
          title={controller.phase === "refreshing" ? "Refreshing…" : "Refresh"}
          disabled={!controller.connected ||
            controller.phase === "loading" ||
            controller.phase === "refreshing"}
          onclick={() => controller.refresh(true)}
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
      <Collapsible.Content class="maintenance-toolbar-details">
        <MaintenanceContext {controller} {title} />
        {#if cacheLabel}<p class="maintenance-cache-label">
            {cacheLabel}
          </p>{/if}
        {#if controller.connected}<div class="maintenance-fixed-filters">
            <MaintenanceFilters {controller} />
          </div>{/if}
      </Collapsible.Content>
    </Collapsible.Root></Tooltip.Provider
  ></AppShell.Toolbar
>
