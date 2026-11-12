<script lang="ts">
  import { AppShell } from "@lapismd/design-core/shell";
  import GitHubIcon from "./GitHubIcon.svelte";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { RefreshCw } from "@lucide/svelte";
  import MaintenanceDetails from "./MaintenanceDetails.svelte";
  import MaintenanceActions from "./MaintenanceActions.svelte";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  let {
    controller,
    onClose,
  }: { controller: MaintenanceController; onClose: () => void } = $props();
</script>

<AppShell.Sidebar
  side="right"
  label="Item inspector"
  variant="attached"
  mobileLabel="Details"
  closeable
  constraintPriority={20}
  constrainedPresentation="replace-main"
>
  <AppShell.Sidebar.Header
    ><div class="maintenance-inspector-heading">
      <strong>Details</strong><span class="maintenance-toolbar-spacer"
      ></span>{#if controller.selectedId}<Button
          variant="ghost"
          size="icon-sm"
          aria-label="Refresh item details"
          title="Refresh item details"
          disabled={controller.detailLoading || controller.commands.busy}
          onclick={() =>
            controller.selectedId &&
            controller.select(controller.selectedId, true)}
          ><RefreshCw size={15} aria-hidden="true" /></Button
        >{/if}{#if controller.detail}<a
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
    ><MaintenanceDetails {controller} {onClose} /></AppShell.Sidebar.Body
  >
  <AppShell.Sidebar.Footer style="padding:0"
    ><MaintenanceActions {controller} /></AppShell.Sidebar.Footer
  >
</AppShell.Sidebar>
