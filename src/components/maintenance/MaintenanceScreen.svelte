<script lang="ts">
  import { AppShell, AppShellController } from "@lapismd/design-core/shell";
  import { onDestroy, untrack, type Snippet } from "svelte";
  import MaintenanceNavigation from "./MaintenanceNavigation.svelte";
  import MaintenanceToolbar from "./MaintenanceToolbar.svelte";
  import MaintenanceInbox from "./MaintenanceInbox.svelte";
  import MaintenanceInspector from "./MaintenanceInspector.svelte";
  import MaintenanceStatus from "./MaintenanceStatus.svelte";
  import ActionInputDialog from "./ActionInputDialog.svelte";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  import type { PersonalProfile } from "@lapismd/repository-ui/settings";
  import { provideFeedback } from "../feedback/context";
  import FeedbackHost from "../feedback/FeedbackHost.svelte";
  const feedback = provideFeedback();
  let {
    controller,
    profile,
    dark = false,
    onToggleTheme,
    onConnect,
    sessionMode = "demo",
    onDisconnect,
    cacheLabel = "",
    notice = "",
    settings,
  }: {
    controller: MaintenanceController;
    profile: PersonalProfile;
    dark?: boolean;
    onToggleTheme: () => void;
    onConnect: () => void;
    sessionMode?: "demo" | "github";
    onDisconnect?: () => void;
    cacheLabel?: string;
    notice?: string;
    settings?: Snippet;
  } = $props();
  const shell = new AppShellController({
    leftWidth: 224,
    rightWidth: 440,
    rightClosed: true,
  });
  const title = $derived(
    {
      operations: "Operations",
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
        shell.right.expand();
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
  function openDetail(id: string) {
    shell.right.expand();
    if (shell.mobile.resolvedMode === "mobile") shell.mobile.show("right");
    void controller.select(id);
  }
  onDestroy(() => {
    void shell.dispose();
  });
</script>

<div class="maintenance-app" data-ui-theme="lapis">
  <AppShell.Root
    controller={shell}
    mobileBreakpoint={800}
    desktopMinMainWidth={280}
  >
    <MaintenanceNavigation
      {controller}
      {shell}
      {dark}
      {onToggleTheme}
      {onConnect}
      {profile}
      {sessionMode}
      {onDisconnect}
    />
    <AppShell.Main>
      <MaintenanceToolbar
        {controller}
        {title}
        {sessionMode}
        {cacheLabel}
        {settings}
      />
      <AppShell.Body layout="regions" class="maintenance-shell-body"
        ><div class="maintenance-shell-body-content">
          <MaintenanceInbox
            {sessionMode}
            {controller}
            {onConnect}
            onOpen={openDetail}
          />
        </div>
        <footer class="maintenance-body-status">
          <MaintenanceStatus {controller} {notice} {sessionMode} />
        </footer></AppShell.Body
      >
    </AppShell.Main>
    <MaintenanceInspector {controller} {sessionMode} onClose={closeDetail} />
  </AppShell.Root>
  <ActionInputDialog {controller} {sessionMode} />
  {#if feedback.owned}<FeedbackHost center={feedback.center} />{/if}
</div>
