<script lang="ts">
  import { onDestroy, untrack } from "svelte";
  import { AppShell, AppShellController } from "@lapismd/design-core/shell";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import { ArrowLeft, RefreshCw } from "@lucide/svelte";
  import type { PersonalProfile } from "@lapismd/repository-ui/settings";
  import MaintenanceNavigation from "../maintenance/MaintenanceNavigation.svelte";
  import MaintenanceToolbar from "../maintenance/MaintenanceToolbar.svelte";
  import MaintenanceInbox from "../maintenance/MaintenanceInbox.svelte";
  import GitHubIcon from "../maintenance/GitHubIcon.svelte";
  import ReviewWorkspace from "./ReviewWorkspace.svelte";
  import ReviewInspector from "./ReviewInspector.svelte";
  import ReviewConfirmation from "./ReviewConfirmation.svelte";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  import type { ReviewController } from "../../maintenance/review/controller.svelte";
  import "./review.css";
  let {
    inbox,
    review,
    profile,
    dark,
    onToggleTheme,
  }: {
    inbox: MaintenanceController;
    review: ReviewController;
    profile: PersonalProfile;
    dark: boolean;
    onToggleTheme: () => void;
  } = $props();
  const shell = new AppShellController({
    leftWidth: 224,
    rightWidth: 440,
    rightClosed: true,
  });
  let previousView = untrack(() => inbox.view);
  const title = $derived(
    {
      inbox: "Inbox",
      activity: "Activity",
      "pull-request": "Pull requests",
      workflow: "Workflows",
      approval: "Approvals",
    }[inbox.view],
  );
  $effect(() => {
    const selected = review.selectedId,
      workspace = review.workspaceOpen;
    untrack(() => {
      if (selected && !workspace) shell.right.expand();
      else shell.right.close();
    });
  });
  $effect(() => {
    const view = inbox.view;
    if (view !== previousView) {
      previousView = view;
      review.close();
      shell.mobile.showMain();
    }
  });
  function open(id: string) {
    void inbox.select(id);
    void review.select(id);
    shell.right.expand();
    if (shell.mobile.resolvedMode === "mobile") shell.mobile.show("right");
  }
  function workspace() {
    review.workspaceOpen = true;
    shell.mobile.showMain();
  }
  onDestroy(() => {
    void shell.dispose();
  });
</script>

<div class="maintenance-app review-ui" data-ui-theme="lapis">
  <AppShell.Root
    controller={shell}
    mobileBreakpoint={800}
    desktopMinMainWidth={280}
  >
    <MaintenanceNavigation
      controller={inbox}
      {shell}
      {profile}
      {dark}
      {onToggleTheme}
      onConnect={() => {}}
    />
    <AppShell.Main>
      {#if review.workspaceOpen}
        <AppShell.Toolbar
          ><div class="review-main-toolbar">
            <AppShell.Sidebar.Toggle side="left" /><Button
              variant="ghost"
              size="sm"
              onclick={() => {
                review.close();
                shell.mobile.showMain();
              }}><ArrowLeft size={15} aria-hidden="true" />Back to inbox</Button
            ><span class="review-toolbar-divider">/</span><span
              class="review-toolbar-title"
              >Pull request #{review.overview?.number}</span
            ><span class="maintenance-toolbar-spacer"></span><Badge
              variant="secondary">UI preview</Badge
            ><Button
              variant="ghost"
              size="icon-sm"
              aria-label="Refresh pull request"
              disabled={review.pending}
              onclick={() => review.refresh()}
              ><RefreshCw size={15} aria-hidden="true" /></Button
            >{#if review.overview}<a
                class="maintenance-icon-link"
                href={review.overview.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open pull request on GitHub"><GitHubIcon /></a
              >{/if}
          </div></AppShell.Toolbar
        >
      {:else}<MaintenanceToolbar
          controller={inbox}
          {title}
          notice="UI preview · fixture-only data and simulated actions"
        />{/if}
      <AppShell.Body layout="regions"
        >{#if review.workspaceOpen}<ReviewWorkspace
            controller={review}
          />{:else}<MaintenanceInbox
            controller={inbox}
            onConnect={() => {}}
            onOpen={open}
          />{/if}</AppShell.Body
      >
    </AppShell.Main>
    <ReviewInspector controller={review} onOpen={workspace} />
  </AppShell.Root>
  <ReviewConfirmation controller={review} />
</div>
