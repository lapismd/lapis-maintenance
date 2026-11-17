<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import { Skeleton } from "@lapismd/design-core/shadcn/skeleton";
  import * as Empty from "@lapismd/design-core/shadcn/empty";
  import { FileSearch, CircleAlert } from "@lucide/svelte";
  import FeedbackFeed from "../feedback/FeedbackFeed.svelte";
  import { outcomeSeverity } from "../../maintenance/feedback.svelte";
  import RepositoryReview from "./RepositoryReview.svelte";
  import MaintenanceRunPanel from "./MaintenanceRunPanel.svelte";
  import { statusLabels, type MaintenanceItem } from "../../maintenance/types";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  let {
    controller,
    sessionMode = "demo",
    onClose,
  }: {
    controller: MaintenanceController;
    sessionMode?: "demo" | "github";
    onClose: () => void;
  } = $props();
  const detail = $derived(controller.detail);
  const selected = $derived(
    controller.snapshot?.items.find(
      (item) => item.id === controller.selectedId,
    ),
  );
  const receipt = $derived(
    controller.commands.receipts
      .filter((r) => r.command.itemId === controller.selectedId)
      .at(-1),
  );
</script>

{#snippet itemHeading(item: MaintenanceItem)}
  <div class="maintenance-detail-heading">
    <span class="maintenance-eyebrow">{item.category} · {item.repository}</span>
    <h2>{item.title}</h2>
    <Badge variant="outline">{statusLabels[item.status]}</Badge>
  </div>
{/snippet}

<FeedbackFeed
  scope="inspector"
  pending={controller.detailLoading || controller.commands.busy}
  notices={[
    ...(controller.detailError
      ? [
          {
            id: `detail:${controller.selectedId}`,
            title: "Could not refresh details",
            message: controller.detailError,
            severity: "error" as const,
            action: {
              label: "Retry",
              run: () =>
                controller.selectedId &&
                void controller.select(controller.selectedId, true),
            },
          },
        ]
      : []),
    ...(receipt
      ? [
          {
            id: `command:${receipt.command.requestId}`,
            title: `${sessionMode === "github" ? "GitHub" : "Preview"} · ${receipt.status}`,
            message: receipt.message,
            severity: outcomeSeverity(receipt.status),
          },
        ]
      : []),
  ]}
/>

<div class="maintenance-details" aria-label="Maintenance item details">
  {#if controller.detailLoading && !detail}
    {#if selected}
      {@render itemHeading(selected)}
      <p class="maintenance-muted" role="status">Loading details…</p>
      {#each selected.reasons as reason}<p>{reason}</p>{/each}
    {:else}
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
    {/if}
  {:else if controller.detailError && !detail}
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
    {#if controller.detailLoading}<p class="maintenance-muted" role="status">
        Showing cached details · Refreshing…
      </p>
    {/if}
    {@render itemHeading(detail.item)}
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
