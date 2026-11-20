<script lang="ts">
  import { onDestroy } from "svelte";
  import { IntentPrefetch } from "../../maintenance/intent-prefetch";
  import { cardIntent } from "../../maintenance/card-intent";
  import {
    KanbanBoard,
    KanbanActivityView,
    type KanbanColumnData,
    type KanbanColumnMeta,
    type KanbanCardContext,
  } from "@lapismd/design-core/workspace/kanban";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Copy, LoaderCircle, Tag } from "@lucide/svelte";
  import { maintenanceColumns } from "../../maintenance/board";
  import { copyIdentifier } from "../../maintenance/copy-identifier";
  import type { FeedbackNotice } from "../../maintenance/feedback.svelte";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  import FeedbackFeed from "../feedback/FeedbackFeed.svelte";
  let {
    controller,
    onOpen,
    onPrefetch,
  }: {
    controller: MaintenanceController;
    onOpen: (id: string) => void;
    onPrefetch?: (id: string, signal: AbortSignal) => Promise<unknown>;
  } = $props();
  const prefetch = new IntentPrefetch(
    (id, signal) => onPrefetch?.(id, signal) ?? Promise.resolve(),
  );
  onDestroy(() => prefetch.dispose());
  let metadata = $state<Record<string, KanbanColumnMeta>>({});
  let order = $state<string[]>([]);
  let copyNotices = $state<FeedbackNotice[]>([]);
  let copyNoticeSequence = 0;
  const columns = $derived(
    maintenanceColumns(controller.items, controller.snapshot?.fetchedAt)
      .map((c) => ({
        ...c,
        label: metadata[c.id]?.title ?? c.label,
        color: metadata[c.id]?.color ?? c.color,
        primary: !!c.cards.length && c.primary,
        locked: !!c.cards.length && c.locked,
        excludeFromAutoExpand: !c.cards.length,
      }))
      .toSorted((a, b) =>
        order.length ? order.indexOf(a.id) - order.indexOf(b.id) : 0,
      ),
  );
  const boardKey = $derived(
    `${controller.view}:${columns
      .filter((column) => !column.cards.length)
      .map((column) => column.id)
      .join(":")}`,
  );
  const dates = $derived(
    new Map(controller.items.map((item) => [item.id, item.updatedAt])),
  );
  const itemsById = $derived(
    new Map(controller.items.map((item) => [item.id, item])),
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
  const columnUrls = (column: KanbanColumnData) =>
    column.cards.flatMap((card) => {
      const url = itemsById.get(card.id)?.url;
      return url ? [url] : [];
    });
  async function copyColumnLinks(
    column: KanbanColumnData,
    closeMenu: () => void,
  ) {
    const urls = columnUrls(column);
    if (!urls.length) return;
    try {
      await copyIdentifier(urls.join("\n"));
      copyNotices = [
        {
          id: `board-copy-links:${++copyNoticeSequence}`,
          title: "GitHub links copied",
          severity: "info",
          message: `Copied ${urls.length} GitHub ${urls.length === 1 ? "link" : "links"}.`,
        },
      ];
    } catch (error) {
      copyNotices = [
        {
          id: `board-copy-links:${++copyNoticeSequence}`,
          title: "Could not copy GitHub links",
          severity: "error",
          message: "The GitHub links could not be copied to the clipboard.",
          detail: error instanceof Error ? error.message : String(error),
        },
      ];
    } finally {
      closeMenu();
    }
  }
</script>

{#snippet cardTags({ card }: KanbanCardContext)}
  <span
    class="maintenance-card-tags"
    use:cardIntent={{ id: card.id, prefetch }}
  >
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
    {#key boardKey}
      <KanbanBoard
        cardSnippets={{ tags: cardTags }}
        {columns}
        anchorColumnId={columns.find((column) => column.cards.length)?.id ??
          null}
        movesEnabled={false}
        ariaLabel="Maintenance status board. Use arrow keys to navigate and Enter to open details."
        onCardOpen={(id) => onOpen(id)}
        onMoveCardToColumn={() => {}}
        onReorderColumns={(ids) => (order = ids)}
        onEditColumn={(id, meta) => (metadata = { ...metadata, [id]: meta })}
        emptyTitle="No maintenance items match"
        emptyDescription="Clear the filters or refresh to check for new work."
        brandLabel="Lapis Maintenance"
      >
        {#snippet columnMenuActions(column, closeMenu)}
          <Button
            variant="ghost"
            role="menuitem"
            disabled={!columnUrls(column).length}
            onclick={() => copyColumnLinks(column, closeMenu)}
          >
            <Copy size={14} aria-hidden="true" />
            <span>Copy GitHub links</span>
          </Button>
        {/snippet}
      </KanbanBoard>
    {/key}
  {/if}
</div>
<FeedbackFeed scope="board-copy-links" notices={copyNotices} />

<style>
  .maintenance-card-tags,
  .maintenance-card-tags > span {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }
  .maintenance-card-tags {
    margin-block-start: 0.25rem;
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
