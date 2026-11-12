<script lang="ts">
  import {
    AppShell,
    type AppShellController,
  } from "@lapismd/design-core/shell";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import MaintenanceNavigationItem from "./MaintenanceNavigationItem.svelte";
  import MaintenanceRepositories from "./MaintenanceRepositories.svelte";
  import {
    Inbox,
    Activity,
    GitPullRequest,
    Workflow,
    ShieldCheck,
  } from "@lucide/svelte";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  import lapisLogo from "../../assets/lapis-logo.svg";
  import MaintenanceProfile from "./MaintenanceProfile.svelte";
  import type { PersonalProfile } from "@lapismd/repository-ui/settings";
  import type { View } from "../../maintenance/types";
  let {
    controller,
    shell,
    dark,
    onToggleTheme,
    onConnect,
    profile,
    sessionMode = "demo",
    onDisconnect,
  }: {
    controller: MaintenanceController;
    shell: AppShellController;
    dark: boolean;
    onToggleTheme: () => void;
    onConnect: () => void;
    profile: PersonalProfile;
    sessionMode?: "demo" | "github";
    onDisconnect?: () => void;
  } = $props();
  const compact = $derived(
    shell.mobile.resolvedMode === "desktop" &&
      shell.left.collapsed &&
      !shell.left.previewed,
  );
  const navigation = [
    { id: "inbox" as View, label: "Inbox", icon: Inbox },
    { id: "activity" as View, label: "Activity", icon: Activity },
    {
      id: "pull-request" as View,
      label: "Pull requests",
      icon: GitPullRequest,
    },
    { id: "workflow" as View, label: "Workflows", icon: Workflow },
    { id: "approval" as View, label: "Approvals", icon: ShieldCheck },
  ];
</script>

<AppShell.Sidebar
  side="left"
  label="Maintenance navigation"
  mobileLabel="Navigation"
  variant="rail"
  constraintPriority={0}
>
  <AppShell.Sidebar.Header
    ><div class="maintenance-brand" data-compact={compact}>
      <img
        src={lapisLogo}
        alt="Lapis logo"
        width="26"
        height="26"
      />{#if !compact}<span
          >Lapis<span class="maintenance-brand-sub">Maintenance</span></span
        >{/if}
    </div></AppShell.Sidebar.Header
  >
  <AppShell.Sidebar.Body
    ><Tooltip.Provider
      ><nav
        class="maintenance-navigation"
        data-compact={compact}
        aria-label="Maintenance views"
      >
        {#if !compact}<h2 class="maintenance-nav-section">Workspace</h2>{/if}
        {#each navigation as entry}<MaintenanceNavigationItem
            {entry}
            {controller}
            {shell}
            {compact}
          />{/each}
      </nav>
      <MaintenanceRepositories {controller} {compact} /></Tooltip.Provider
    >
  </AppShell.Sidebar.Body>
  <AppShell.Sidebar.Footer style="padding-inline:0"
    ><MaintenanceProfile
      {controller}
      {profile}
      {compact}
      {dark}
      {onToggleTheme}
      {onConnect}
      {sessionMode}
      {onDisconnect}
    /></AppShell.Sidebar.Footer
  >
</AppShell.Sidebar>
