<script lang="ts">
  import {
    KanbanBoard,
    KanbanActivityView,
    type KanbanColumnMeta,
  } from "@lapismd/design-core/workspace/kanban";
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

<div class="maintenance-board">
  {#if controller.view === "activity"}
    <KanbanActivityView
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
