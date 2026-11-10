<script lang="ts">
  import {
    AppShell,
    type AppShellController,
  } from "@lapismd/design-core/shell";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import {
    Inbox,
    Activity,
    GitPullRequest,
    Workflow,
    ShieldCheck,
    FolderGit2,
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
  }: {
    controller: MaintenanceController;
    shell: AppShellController;
    dark: boolean;
    onToggleTheme: () => void;
    onConnect: () => void;
    profile: PersonalProfile;
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
>
  <AppShell.Sidebar.Header
    ><div class="maintenance-brand">
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
    ><nav class="maintenance-navigation" aria-label="Maintenance views">
      {#if !compact}<h2 class="maintenance-nav-section">Workspace</h2>{/if}
      {#each navigation as entry}<Button
          variant="ghost"
          aria-label={entry.label}
          aria-current={controller.view === entry.id ? "page" : undefined}
          onclick={() => {
            controller.view = entry.id;
            shell.mobile.showMain();
          }}
          ><entry.icon size={18} aria-hidden="true" />{#if !compact}<span
              >{entry.label}</span
            >{/if}</Button
        >{/each}
    </nav>
    <nav class="maintenance-navigation" aria-label="Repository filters">
      {#if !compact}<h2 class="maintenance-nav-section">Repositories</h2>{/if}
      <Button
        variant="ghost"
        aria-label="Show all repositories"
        aria-pressed={!controller.repositories.length}
        title="All repositories"
        onclick={() => {
          controller.repositories = [];
          shell.mobile.showMain();
        }}
        ><Inbox size={16} aria-hidden="true" />{#if !compact}<span
            >All repositories</span
          >{/if}</Button
      >
      {#each controller.snapshot?.repositories ?? [] as repo}
        <Button
          variant="ghost"
          aria-label={`Show ${repo.repository}`}
          aria-pressed={controller.repositories.includes(repo.repository)}
          title={repo.repository}
          onclick={() => {
            controller.toggleRepository(repo.repository);
            shell.mobile.showMain();
          }}
          ><FolderGit2 size={16} aria-hidden="true" />{#if !compact}<span
              >{repo.repository.split("/")[1]}</span
            >{/if}</Button
        >
      {/each}
    </nav>
  </AppShell.Sidebar.Body>
  <AppShell.Sidebar.Footer style="padding-inline:0"
    ><MaintenanceProfile
      {controller}
      {profile}
      {compact}
      {dark}
      {onToggleTheme}
      {onConnect}
    /></AppShell.Sidebar.Footer
  >
</AppShell.Sidebar>
