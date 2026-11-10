<script lang="ts">
  import { AppShell, AppShellController } from "@lapismd/design-core/shell";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import { Skeleton } from "@lapismd/design-core/shadcn/skeleton";
  import * as Empty from "@lapismd/design-core/shadcn/empty";
  import { RefreshCw, Unplug, CircleAlert, Link2 } from "@lucide/svelte";
  import { onDestroy, untrack } from "svelte";
  import MaintenanceNavigation from "./MaintenanceNavigation.svelte";
  import GitHubIcon from "./GitHubIcon.svelte";
  import MaintenanceContext from "./MaintenanceContext.svelte";
  import MaintenanceFreshness from "./MaintenanceFreshness.svelte";
  import MaintenanceFilters from "./MaintenanceFilters.svelte";
  import MaintenanceBoard from "./MaintenanceBoard.svelte";
  import MaintenanceDetails from "./MaintenanceDetails.svelte";
  import MaintenanceActions from "./MaintenanceActions.svelte";
  import ActionConfirmation from "./ActionConfirmation.svelte";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  import type { PersonalProfile } from "@lapismd/repository-ui/settings";
  let {
    controller,
    profile,
    dark = false,
    onToggleTheme,
    onConnect,
  }: {
    controller: MaintenanceController;
    profile: PersonalProfile;
    dark?: boolean;
    onToggleTheme: () => void;
    onConnect: () => void;
  } = $props();
  const shell = new AppShellController({
    leftWidth: 224,
    rightWidth: 440,
    rightClosed: true,
  });
  const title = $derived(
    {
      inbox: "Inbox",
      activity: "Activity",
      "pull-request": "Pull requests",
      workflow: "Workflows",
      approval: "Approvals",
    }[controller.view],
  );
  $effect(() => {
    const selected = controller.selectedId;
    untrack(() => {
      if (selected) {
        shell.right.open();
        if (shell.mobile.resolvedMode === "mobile") shell.mobile.show("right");
      } else {
        shell.right.close();
        shell.mobile.showMain();
      }
    });
  });
  function closeDetail() {
    controller.closeDetail();
    shell.mobile.showMain();
  }
  onDestroy(() => {
    void shell.dispose();
  });
</script>

<div class="maintenance-app" data-ui-theme="lapis">
  <AppShell.Root controller={shell}>
    <MaintenanceNavigation
      {controller}
      {shell}
      {dark}
      {onToggleTheme}
      {onConnect}
      {profile}
    />
    <AppShell.Main>
      <AppShell.Toolbar
        ><div class="maintenance-toolbar-content">
          <div class="maintenance-toolbar-row">
            <AppShell.Sidebar.Toggle side="left" />
            <div class="maintenance-breadcrumb">
              LapisMD <span>/</span>
              {title}
            </div>
            <span class="maintenance-toolbar-spacer"
            ></span><MaintenanceFreshness {controller} /><Badge
              variant="secondary">Demo</Badge
            >
            <Button
              size="icon-sm"
              variant="ghost"
              style="color:var(--muted-foreground)"
              aria-label={controller.phase === "refreshing"
                ? "Refreshing"
                : "Refresh"}
              title={controller.phase === "refreshing"
                ? "Refreshing…"
                : "Refresh"}
              disabled={!controller.connected ||
                controller.phase === "loading" ||
                controller.phase === "refreshing"}
              onclick={() => controller.refresh()}
              ><RefreshCw size={15} aria-hidden="true" /></Button
            >
            <AppShell.Sidebar.Toggle side="right" />
          </div>
          <MaintenanceContext {controller} {title} />
          {#if controller.connected}<div class="maintenance-fixed-filters">
              <MaintenanceFilters {controller} />
            </div>{/if}
        </div></AppShell.Toolbar
      >
      <AppShell.Body layout="regions">
        <div class="maintenance-main">
          {#if !controller.connected}<Empty.Root
              ><Empty.Header
                ><Empty.Media variant="icon"
                  ><Unplug aria-hidden="true" /></Empty.Media
                ><Empty.Title>Connect a session</Empty.Title><Empty.Description
                  >Explore the dashboard with an in-memory maintainer session.
                  No real GitHub token is needed.</Empty.Description
                ></Empty.Header
              ><Empty.Content
                ><Button onclick={onConnect}
                  ><Link2 size={16} aria-hidden="true" />Connect demo session</Button
                ></Empty.Content
              ></Empty.Root
            >
          {:else}
            {#if controller.error}<div class="maintenance-alert" role="alert">
                <CircleAlert size={18} aria-hidden="true" />
                <div>
                  <strong
                    >{controller.error.kind === "rate-limit"
                      ? "Rate limit reached"
                      : "Refresh unavailable"}</strong
                  >
                  <p>{controller.error.message}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onclick={() => controller.refresh()}>Retry refresh</Button
                >
              </div>{/if}
            {#if controller.unavailable.length}<div
                class="maintenance-alert"
                role="status"
              >
                <CircleAlert size={18} aria-hidden="true" />
                <div>
                  <strong>Repository coverage is incomplete</strong
                  >{#each controller.unavailable as repo}<p>
                      {repo.repository} — {repo.reason}
                    </p>{/each}
                </div>
              </div>{/if}
            <div class="maintenance-board-heading">
              <h2>
                {controller.items.length}
                {controller.items.length === 1 ? "item" : "items"} in view
              </h2>
              <span
                >{controller.view === "activity"
                  ? "Grouped by latest update"
                  : "Columns reflect observed status"}</span
              >
            </div>
            {#if controller.phase === "loading"}<div
                class="maintenance-loading"
                role="status"
                aria-label="Loading maintenance items"
              >
                {#each [1, 2, 3] as n (n)}<div>
                    <Skeleton style="height:1.8rem;width:60%" /><Skeleton
                      style="height:12rem;width:100%"
                    /><Skeleton style="height:9rem;width:100%" />
                  </div>{/each}
              </div>
            {:else if controller.snapshot}<MaintenanceBoard
                {controller}
                onOpen={(id) => controller.select(id)}
              />{/if}
          {/if}
        </div>
      </AppShell.Body>
    </AppShell.Main>
    <AppShell.Sidebar
      side="right"
      label="Item inspector"
      variant="attached"
      mobileLabel="Details"
      closeable
      constrainedPresentation="replace-main"
    >
      <AppShell.Sidebar.Header
        ><div class="maintenance-inspector-heading">
          <strong>Details</strong><span class="maintenance-toolbar-spacer"
          ></span>{#if controller.detail}<a
              class="maintenance-icon-link"
              aria-label="Open on GitHub"
              title="Open on GitHub"
              href={controller.detail.item.url}
              target="_blank"
              rel="noreferrer"><GitHubIcon /></a
            >{/if}<AppShell.Sidebar.Close />
        </div></AppShell.Sidebar.Header
      >
      <AppShell.Sidebar.Body
        ><MaintenanceDetails
          {controller}
          onClose={closeDetail}
        /></AppShell.Sidebar.Body
      >
      <AppShell.Sidebar.Footer style="padding:0"
        ><MaintenanceActions {controller} /></AppShell.Sidebar.Footer
      >
    </AppShell.Sidebar>
  </AppShell.Root>
  <ActionConfirmation {controller} />
</div>
