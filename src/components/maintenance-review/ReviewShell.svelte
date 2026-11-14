<script lang="ts">
  import type { Snippet } from "svelte";
  import { onDestroy, untrack } from "svelte";
  import { AppShell, AppShellController } from "@lapismd/design-core/shell";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import * as Breadcrumb from "@lapismd/design-core/shadcn/breadcrumb";
  import { ArrowLeft, RefreshCw } from "@lucide/svelte";
  import type { PersonalProfile } from "@lapismd/repository-ui/settings";
  import MaintenanceNavigation from "../maintenance/MaintenanceNavigation.svelte";
  import MaintenanceToolbar from "../maintenance/MaintenanceToolbar.svelte";
  import MaintenanceInbox from "../maintenance/MaintenanceInbox.svelte";
  import GitHubIcon from "../maintenance/GitHubIcon.svelte";
  import ActivityFeed from "../maintenance-activity/ActivityFeed.svelte";
  import ActivityContext from "../maintenance-activity/ActivityContext.svelte";
  import type { ActivityController } from "../../maintenance/activity/controller.svelte";
  import DispatchDialog from "../maintenance-dispatch/DispatchDialog.svelte";
  import type { DispatchController } from "../../maintenance/dispatch/controller.svelte";
  import { Play } from "@lucide/svelte";
  import ReviewWorkspace from "./ReviewWorkspace.svelte";
  import ReviewInspector from "./ReviewInspector.svelte";
  import ReviewConfirmation from "./ReviewConfirmation.svelte";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  import type { ReviewController } from "../../maintenance/review/controller.svelte";
  import "./review.css";
  let {
    inbox,
    activity,
    review,
    profile,
    dark,
    onToggleTheme,
    dispatch,
    sessionMode = "demo",
    notice,
    cacheLabel,
    settings,
    onDisconnect,
    onPrefetch,
  }: {
    dispatch?: DispatchController;
    inbox: MaintenanceController;
    activity: ActivityController;
    review: ReviewController;
    profile: PersonalProfile;
    dark: boolean;
    onToggleTheme: () => void;
    sessionMode?: "demo" | "github";
    notice?: string;
    cacheLabel?: string;
    settings?: Snippet;
    onDisconnect?: () => void;
    onPrefetch?: (id: string, signal: AbortSignal) => Promise<unknown>;
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
      if (view === "activity") {
        review.clearSelection();
        inbox.closeDetail();
      }
      shell.mobile.showMain();
    }
  });
  function open(id: string) {
    if (sessionMode === "demo") void inbox.select(id);
    void review.select(id);
    shell.right.expand();
    if (shell.mobile.resolvedMode === "mobile") shell.mobile.show("right");
  }
  function workspace() {
    review.workspaceOpen = true;
    shell.mobile.showMain();
  }
  function back() {
    review.close();
    shell.mobile.showMain();
  }
  function openRepository(repository?: string) {
    inbox.repositories = repository ? [repository] : [];
    inbox.view = "inbox";
    inbox.closeDetail();
    review.clearSelection();
    back();
  }
  onDestroy(() => {
    void shell.dispose();
  });
</script>

{#snippet liveControls()}{#if dispatch}<Button
      variant="ghost"
      size="icon-sm"
      aria-label="Run workflow"
      title="Run workflow"
      onclick={() => {
        const repository =
          inbox.repositories.length === 1
            ? inbox.repositories[0]
            : inbox.snapshot?.repositories.find((r) => r.available)?.repository;
        if (repository) void dispatch.show(repository);
      }}><Play aria-hidden="true" /></Button
    >{/if}{@render settings?.()}{/snippet}
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
      {sessionMode}
      {onDisconnect}
      onRepository={openRepository}
      onConnect={() => {}}
      onNavigate={(view) => {
        review.close();
        if (view === "activity") {
          review.clearSelection();
          inbox.closeDetail();
        }
      }}
    />
    <AppShell.Main>
      {#if review.workspaceOpen}
        <AppShell.Toolbar
          ><div class="review-main-toolbar">
            <AppShell.Sidebar.Toggle side="left" /><Button
              variant="ghost"
              size="icon-sm"
              class="review-back-button"
              aria-label="Back to inbox"
              title="Back to inbox"
              onclick={back}><ArrowLeft size={15} aria-hidden="true" /></Button
            ><Breadcrumb.Root class="review-pr-breadcrumbs">
              <Breadcrumb.List
                style="flex-wrap:nowrap;gap:0.3rem;font-size:0.75rem"
              >
                <Breadcrumb.Item class="review-pr-breadcrumb-item"
                  ><Button
                    variant="ghost"
                    size="sm"
                    class="review-breadcrumb-control"
                    onclick={() => openRepository()}
                    title="All repositories">All repositories</Button
                  ></Breadcrumb.Item
                >
                <Breadcrumb.Separator />
                <Breadcrumb.Item class="review-pr-breadcrumb-item"
                  ><Button
                    variant="ghost"
                    size="sm"
                    class="review-breadcrumb-control"
                    onclick={() => openRepository(review.overview?.repository)}
                    title={review.overview?.repository}
                    >{review.overview?.repository}</Button
                  ></Breadcrumb.Item
                >
                <Breadcrumb.Separator />
                <Breadcrumb.Item class="review-pr-breadcrumb-item"
                  ><Breadcrumb.Page class="review-pr-breadcrumb-page"
                    >Pull request #{review.overview?.number}</Breadcrumb.Page
                  ></Breadcrumb.Item
                >
              </Breadcrumb.List>
            </Breadcrumb.Root>{#if review.overview}<Badge variant="outline"
                >{review.overview.draft
                  ? "Draft"
                  : review.overview.state === "merged"
                    ? "Merged"
                    : review.overview.state === "closed"
                      ? "Closed"
                      : "Open"}</Badge
              >{/if}{@render liveControls()}<Badge variant="secondary"
              >{sessionMode === "github" ? "Live" : "UI preview"}</Badge
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
      {:else if inbox.view === "activity"}<MaintenanceToolbar
          controller={inbox}
          {title}
          notice={notice ?? "UI preview · fixture activity"}
          {sessionMode}
          {cacheLabel}
          settings={liveControls}
          messages={activity.coverage}
          onRefresh={() => activity.refresh()}
          refreshing={activity.refreshing}
        >
          {#snippet context(searchToggle)}<ActivityContext
              controller={activity}
              controls={searchToggle}
            />{/snippet}
        </MaintenanceToolbar>
      {:else}<MaintenanceToolbar
          controller={inbox}
          {title}
          notice={notice ??
            "UI preview · fixture-only data and simulated actions"}
          {sessionMode}
          {cacheLabel}
          settings={liveControls}
        />{/if}
      <AppShell.Body layout="regions"
        >{#if review.workspaceOpen}<ReviewWorkspace
            controller={review}
          />{:else if inbox.view === "activity"}<ActivityFeed
            controller={activity}
            query={{
              search: inbox.query,
              repositories:
                sessionMode === "github" && !inbox.repositories.length
                  ? (inbox.snapshot?.repositories.map((r) => r.repository) ??
                    [])
                  : inbox.repositories,
              statuses: inbox.statuses,
            }}
            onOpen={open}
            onRepository={openRepository}
          />{:else}<MaintenanceInbox
            controller={inbox}
            onConnect={() => {}}
            onOpen={open}
            {onPrefetch}
          />{/if}</AppShell.Body
      >
    </AppShell.Main>
    <ReviewInspector controller={review} onOpen={workspace} />
  </AppShell.Root>
  {#if dispatch}<DispatchDialog
      controller={dispatch}
      repositories={inbox.snapshot?.repositories.map((r) => r.repository) ?? []}
      live={sessionMode === "github"}
    />{/if}
  <ReviewConfirmation controller={review} live={sessionMode === "github"} />
</div>
