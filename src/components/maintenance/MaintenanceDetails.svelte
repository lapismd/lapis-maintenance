<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import { Skeleton } from "@lapismd/design-core/shadcn/skeleton";
  import * as Empty from "@lapismd/design-core/shadcn/empty";
  import { FileSearch, CircleAlert } from "@lucide/svelte";
  import RepositoryReview from "./RepositoryReview.svelte";
  import MaintenanceRunPanel from "./MaintenanceRunPanel.svelte";
  import { statusLabels } from "../../maintenance/types";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  let {
    controller,
    onClose,
  }: { controller: MaintenanceController; onClose: () => void } = $props();
  const detail = $derived(controller.detail);
  const receipt = $derived(
    controller.commands.receipts
      .filter((r) => r.command.itemId === controller.selectedId)
      .at(-1),
  );
</script>

<div class="maintenance-details" aria-label="Maintenance item details">
  {#if controller.detailLoading && !detail}
    <div
      role="status"
      aria-label="Loading item details"
      class="maintenance-detail-skeleton"
    >
      <Skeleton
        style="height:1.5rem;width:80%"
      />{#each [1, 2, 3, 4] as n (n)}<Skeleton
          style="height:3rem;width:100%"
        />{/each}
    </div>
  {:else if controller.detailError}
    <Empty.Root
      ><Empty.Header
        ><Empty.Media variant="icon"
          ><CircleAlert aria-hidden="true" /></Empty.Media
        ><Empty.Title>Details unavailable</Empty.Title><Empty.Description
          >{controller.detailError}</Empty.Description
        ></Empty.Header
      ><Empty.Content
        ><Button
          onclick={() =>
            controller.selectedId && controller.select(controller.selectedId)}
          >Retry details</Button
        ></Empty.Content
      ></Empty.Root
    >
  {:else if detail}
    <div class="maintenance-detail-heading">
      <span class="maintenance-eyebrow"
        >{detail.item.category} · {detail.item.repository}</span
      >
      <h2>{detail.item.title}</h2>
      <Badge variant="outline">{statusLabels[detail.item.status]}</Badge>
    </div>
    {#if receipt}<div
        class="maintenance-feedback"
        data-outcome={receipt.status}
        role="status"
      >
        <strong
          >{receipt.status === "accepted"
            ? "Accepted · still running"
            : receipt.status === "uncertain"
              ? "Outcome unknown"
              : receipt.status === "rejected"
                ? "Action not completed"
                : "Completed"}</strong
        >
        <p>{receipt.message}</p>
      </div>{/if}
    {#if detail.item.kind === "pull-request" || detail.pullRequest}
      <RepositoryReview
        detail={detail.pullRequest ?? detail}
        context={detail.pullRequest ? detail : undefined}
        {controller}
        {onClose}
      />
    {:else}
      <MaintenanceRunPanel {detail} {controller} {onClose} />
    {/if}
  {:else}<Empty.Root
      ><Empty.Header
        ><Empty.Media variant="icon"
          ><FileSearch aria-hidden="true" /></Empty.Media
        ><Empty.Title>Choose an item</Empty.Title><Empty.Description
          >Open a board card to inspect its checks and next actions.</Empty.Description
        ></Empty.Header
      ></Empty.Root
    >{/if}
</div>
