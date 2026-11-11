<script lang="ts">
  import {
    KanbanBoard,
    KanbanActivityView,
    type KanbanColumnMeta,
    type KanbanCardContext,
  } from "@lapismd/design-core/workspace/kanban";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import { LoaderCircle, Tag } from "@lucide/svelte";
  import { maintenanceColumns } from "../../maintenance/board";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  let {
    controller,
    onOpen,
  }: { controller: MaintenanceController; onOpen: (id: string) => void } =
    $props();
  let metadata = $state<Record<string, KanbanColumnMeta>>({});
  let order = $state<string[]>([]);
  const columns = $derived(
    maintenanceColumns(controller.items, controller.snapshot?.fetchedAt)
      .map((c) => ({
        ...c,
        label: metadata[c.id]?.title ?? c.label,
        color: metadata[c.id]?.color ?? c.color,
      }))
      .toSorted((a, b) =>
        order.length ? order.indexOf(a.id) - order.indexOf(b.id) : 0,
      ),
  );
  const dates = $derived(
    new Map(controller.items.map((item) => [item.id, item.updatedAt])),
  );
  const entries = $derived(
    columns.flatMap((column) =>
      column.cards.map((card) => ({
        card,
        columnId: column.id,
        date: dates.get(card.id),
      })),
    ),
  );
</script>

{#snippet cardTags({ card }: KanbanCardContext)}
  <span class="maintenance-card-tags">
    {#each card.tags ?? [] as tag}<span
        ><Tag size={12} aria-hidden="true" /><Badge
          variant="outline"
          style="color:inherit;border-color:currentColor;background:transparent;font-size:inherit"
          >{tag}</Badge
        ></span
      >{/each}
    {#if controller.isRefreshing(card.id)}
      <span
        role="img"
        aria-label={`Refreshing ${card.title}`}
        title="Refreshing cached card"
      >
        <LoaderCircle
          class="maintenance-card-spinner"
          size={14}
          aria-hidden="true"
        />
      </span>
    {/if}
  </span>
{/snippet}
<div class="maintenance-board">
  {#if controller.view === "activity"}
    <KanbanActivityView
      cardSnippets={{ tags: cardTags }}
      {entries}
      columns={columns.map((column) => ({
        id: column.id,
        label: column.label,
      }))}
      ariaLabel="Maintenance activity grouped by latest update"
      onCardOpen={(id) => onOpen(id)}
    />
  {:else}
    <KanbanBoard
      cardSnippets={{ tags: cardTags }}
      {columns}
      anchorColumnId={columns.find((column) => column.cards.length)?.id ??
        "approval"}
      movesEnabled={false}
      ariaLabel="Maintenance status board. Use arrow keys to navigate and Enter to open details."
      onCardOpen={(id) => onOpen(id)}
      onMoveCardToColumn={() => {}}
      onReorderColumns={(ids) => (order = ids)}
      onEditColumn={(id, meta) => (metadata = { ...metadata, [id]: meta })}
      emptyTitle="No maintenance items match"
      emptyDescription="Clear the filters or refresh to check for new work."
      brandLabel="Lapis Maintenance"
    />
  {/if}
</div>

<style>
  .maintenance-card-tags,
  .maintenance-card-tags > span {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }
  .maintenance-card-tags {
    flex-wrap: wrap;
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
  }
  .maintenance-card-tags :global(.maintenance-card-spinner) {
    animation: maintenance-card-spin 1s linear infinite;
  }
  @keyframes maintenance-card-spin {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .maintenance-card-tags :global(.maintenance-card-spinner) {
      animation: none;
    }
  }
</style>
