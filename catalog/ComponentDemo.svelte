<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { AppShell, AppShellController } from "@lapismd/design-core/shell";
  import MaintenanceToolbar from "../src/components/maintenance/MaintenanceToolbar.svelte";
  import StatusFilter from "../src/components/maintenance/StatusFilter.svelte";
  import MaintenanceStatus from "../src/components/maintenance/MaintenanceStatus.svelte";
  import MaintenanceInbox from "../src/components/maintenance/MaintenanceInbox.svelte";
  import MaintenanceInspector from "../src/components/maintenance/MaintenanceInspector.svelte";
  import MaintenanceNavigation from "../src/components/maintenance/MaintenanceNavigation.svelte";
  import MaintenanceBoard from "../src/components/maintenance/MaintenanceBoard.svelte";
  import MaintenanceFilters from "../src/components/maintenance/MaintenanceFilters.svelte";
  import MaintenanceContext from "../src/components/maintenance/MaintenanceContext.svelte";
  import MaintenanceRunPanel from "../src/components/maintenance/MaintenanceRunPanel.svelte";
  import MaintenanceChecks from "../src/components/maintenance/MaintenanceChecks.svelte";
  import MaintenanceDetails from "../src/components/maintenance/MaintenanceDetails.svelte";
  import MaintenanceActions from "../src/components/maintenance/MaintenanceActions.svelte";
  import MaintenanceProfile from "../src/components/maintenance/MaintenanceProfile.svelte";
  import RepositoryReview from "../src/components/maintenance/RepositoryReview.svelte";
  import RepositoryFilter from "../src/components/maintenance/RepositoryFilter.svelte";
  import ActionConfirmation from "../src/components/maintenance/ActionConfirmation.svelte";
  import { MaintenanceController } from "../src/maintenance/controller.svelte";
  import { MemoryMaintenancePort, type Scenario } from "./memory-port";
  import type { View } from "../src/maintenance/types";
  let {
    part,
    scenario = "populated",
    selected = "failure",
    view = "inbox",
    compact = false,
  }: {
    part: string;
    scenario?: Scenario;
    selected?: string;
    view?: View;
    compact?: boolean;
  } = $props();
  const port = untrack(() => new MemoryMaintenancePort(scenario));
  const controller = untrack(
    () => new MaintenanceController(port, port, scenario !== "disconnected"),
  );
  const shell = untrack(
    () =>
      new AppShellController({
        leftWidth: 224,
        leftCollapsed: compact,
        rightWidth: 440,
        rightClosed: false,
      }),
  );
  const profile = {
    principal: "demo-maintainer",
    revision: 0,
    details: {
      display_name: "Demo maintainer",
      description: "In-memory session",
      avatar: null,
      email: null,
      gravatar: false,
    },
  };
  let dark = $state(false);
  onMount(() => {
    controller.view = view;
    if (controller.connected)
      void controller.refresh().then(async () => {
        if (
          [
            "inspector",
            "details",
            "actions",
            "checks",
            "run-panel",
            "review",
            "confirmation",
          ].includes(part)
        ) {
          await controller.select(selected);
          if (part === "confirmation" && controller.detail)
            controller.commands.prepare(controller.detail.item, "rerun-failed");
        }
      });
    return () => {
      controller.dispose();
      void shell.dispose();
    };
  });
</script>

<div class="maintenance-app component-demo" data-ui-theme="lapis">
  {#if ["toolbar", "navigation", "inspector"].includes(part)}
    <AppShell.Root controller={shell}>
      {#if part === "navigation"}<MaintenanceNavigation
          {controller}
          {shell}
          {profile}
          {dark}
          onToggleTheme={() => (dark = !dark)}
          onConnect={() => controller.connect()}
        />{/if}
      <AppShell.Main>
        {#if part === "toolbar"}<MaintenanceToolbar
            {controller}
            title="Inbox"
          />
        {:else}<AppShell.Toolbar
            ><AppShell.Sidebar.Toggle side="left" /><span
              >Component preview</span
            ></AppShell.Toolbar
          >{/if}
        <AppShell.Body
          ><p>Production component with an in-memory host.</p></AppShell.Body
        >
      </AppShell.Main>
      {#if part === "inspector"}<MaintenanceInspector
          {controller}
          onClose={() => controller.closeDetail()}
        />{/if}
    </AppShell.Root>
  {:else}
    <div
      class="component-surface"
      class:component-surface-board={part === "board" || part === "inbox"}
    >
      {#if part === "inbox"}<MaintenanceInbox
          {controller}
          onConnect={() => controller.connect()}
        />
      {:else if part === "board"}<MaintenanceBoard
          {controller}
          onOpen={(id) => controller.select(id)}
        />
      {:else if part === "status-filter"}<StatusFilter {controller} />
      {:else if part === "status"}<MaintenanceStatus {controller} />
      {:else if part === "filters"}<MaintenanceFilters {controller} />
      {:else if part === "summary"}<MaintenanceContext
          {controller}
          title="Inbox"
        />
      {:else if part === "picker"}<RepositoryFilter {controller} {compact} />
      {:else if part === "profile"}<MaintenanceProfile
          {controller}
          {profile}
          {compact}
          {dark}
          onToggleTheme={() => (dark = !dark)}
          onConnect={() => controller.connect()}
        />
      {:else if part === "details"}<MaintenanceDetails
          {controller}
          onClose={() => controller.closeDetail()}
        />
      {:else if part === "actions"}<MaintenanceActions {controller} />
      {:else if part === "run-panel" && controller.detail}<MaintenanceRunPanel
          detail={controller.detail}
          {controller}
          onClose={() => controller.closeDetail()}
        />
      {:else if part === "checks" && controller.detail}<MaintenanceChecks
          detail={controller.detail}
          {controller}
        />
      {:else if part === "review" && controller.detail}<RepositoryReview
          detail={controller.detail}
          {controller}
          onClose={() => controller.closeDetail()}
        />
      {:else if part === "confirmation"}<ActionConfirmation {controller} />{/if}
    </div>
  {/if}
</div>

<style>
  .component-demo {
    height: 40rem;
    min-height: 0;
  }
  .component-surface {
    padding: 1.5rem;
    max-width: 52rem;
  }
  .component-surface-board {
    height: 100%;
    max-width: none;
    display: flex;
    flex-direction: column;
  }
</style>
