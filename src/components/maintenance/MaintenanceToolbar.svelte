<script lang="ts">
  import { AppShell } from "@lapismd/design-core/shell";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import { RefreshCw } from "@lucide/svelte";
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
</script>

<AppShell.Toolbar
  ><div class="maintenance-toolbar-content">
    <div class="maintenance-toolbar-row">
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
      <AppShell.Sidebar.Toggle side="right" />
    </div>
    <MaintenanceContext {controller} {title} />
    {#if cacheLabel}<p class="maintenance-cache-label">
        {cacheLabel}
      </p>{/if}
    {#if controller.connected}<div class="maintenance-fixed-filters">
        <MaintenanceFilters {controller} />
      </div>{/if}
  </div></AppShell.Toolbar
>
