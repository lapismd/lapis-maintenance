<!-- Adapted from Lapis Community CommunityProjectsVirtualRows.svelte at a5f64a4c7dea2f29b4058aa7666a98c4c0dee656, Apache-2.0. See THIRD_PARTY_NOTICES.md. -->
<script lang="ts" generics="Row">
  import { createVirtualizer } from "@tanstack/svelte-virtual";
  import { get } from "svelte/store";
  import { onDestroy, untrack, tick, type Snippet } from "svelte";

  let {
    rows,
    viewport,
    initialOffset = 0,
    row,
    getKey = (item: Row, index: number) =>
      (item as { id?: string }).id || String(index),
    estimateSize = () => 64,
    overscan = 8,
    class: className = "",
    loading = false,
    hasMore = false,
    onLoadMore,
    onVisibleCursorChange,
    cursorForRow,
    scrollToKey,
  }: {
    rows: readonly Row[];
    viewport: HTMLElement | null;
    initialOffset?: number;
    row: Snippet<[Row, number]>;
    getKey?: ((row: Row, index: number) => string) | undefined;
    estimateSize?:
      | ((row: Row | undefined, index: number) => number)
      | undefined;
    overscan?: number | undefined;
    class?: string | undefined;
    loading?: boolean | undefined;
    hasMore?: boolean | undefined;
    onLoadMore?: (() => void) | undefined;
    onVisibleCursorChange?: ((cursor: string | undefined) => void) | undefined;
    cursorForRow?: ((row: Row) => string | undefined) | undefined;
    scrollToKey?: string | null | undefined;
  } = $props();

  const scrollElement = $derived(viewport);
  let host = $state<HTMLDivElement | null>(null);
  let alive = true;
  const restoreOffset = untrack(() => initialOffset);
  let restored = false;
  let lastLoadMoreKey = "";
  let lastCursor: string | undefined;
  let lastScrollToKey: string | null | undefined;
  let prior:
    | {
        rows: readonly Row[];
        scrollElement: HTMLElement | null | undefined;
        overscan: number;
      }
    | undefined;

  onDestroy(() => {
    alive = false;
  });

  const virtualizer = createVirtualizer<HTMLElement, HTMLDivElement>({
    count: 0,
    initialOffset: restoreOffset,
    getScrollElement: () => scrollElement ?? null,
    getItemKey: (index) => getKey(rows[index]!, index),
    estimateSize: (index) => estimateSize(rows[index], index),
    enabled: false,
    overscan: 0,
    useAnimationFrameWithResizeObserver: true,
  });

  function measure(node: HTMLDivElement) {
    untrack(() => get(virtualizer).measureElement(node));
    return {
      destroy() {
        untrack(() => {
          if (alive) get(virtualizer).measureElement(null);
        });
      },
    };
  }

  $effect(() => {
    const nextRows = rows;
    const nextHost = host;
    const nextScrollElement = scrollElement;
    const nextOverscan = overscan;
    untrack(() => {
      if (!nextHost || !nextScrollElement) return;
      if (
        prior?.rows === nextRows &&
        prior.scrollElement === nextScrollElement &&
        prior.overscan === nextOverscan
      )
        return;
      prior = {
        rows: nextRows,
        scrollElement: nextScrollElement,
        overscan: nextOverscan,
      };
      get(virtualizer).setOptions({
        enabled: nextScrollElement != null,
        count: nextRows.length,
        scrollMargin:
          nextHost.getBoundingClientRect().top -
          nextScrollElement.getBoundingClientRect().top +
          nextScrollElement.scrollTop,
        getScrollElement: () => nextScrollElement ?? null,
        getItemKey: (index) => getKey(nextRows[index]!, index),
        estimateSize: (index) => estimateSize(nextRows[index], index),
        overscan: nextOverscan,
      });
    });
  });

  $effect(() => {
    if (restored || !scrollElement || !$virtualizer.getTotalSize()) return;
    restored = true;
    const instance = $virtualizer;
    void tick().then(() => {
      if (alive) instance.scrollToOffset(restoreOffset, { align: "start" });
    });
  });

  $effect(() => {
    const key = scrollToKey;
    if (!key || key === lastScrollToKey) return;
    const index = rows.findIndex(
      (item, rowIndex) => getKey(item, rowIndex) === key,
    );
    if (index < 0) return;
    lastScrollToKey = key;
    untrack(() => get(virtualizer).scrollToIndex(index, { align: "center" }));
  });

  $effect(() => {
    const items = $virtualizer.getVirtualItems();
    if (items.length === 0) return;
    const first = rows[$virtualizer.range?.startIndex ?? items[0]!.index];
    const cursor = first && cursorForRow ? cursorForRow(first) : undefined;
    if (cursor !== lastCursor) {
      lastCursor = cursor;
      onVisibleCursorChange?.(cursor);
    }
    const last = items.at(-1);
    if (!last || rows.length === 0 || !hasMore || loading || !onLoadMore)
      return;
    if (last.index < Math.max(0, rows.length - Math.max(4, overscan))) return;
    const finalRow = rows.at(-1);
    if (!finalRow) return;
    const loadKey = `${rows.length}:${getKey(finalRow, rows.length - 1)}`;
    if (loadKey === lastLoadMoreKey) return;
    lastLoadMoreKey = loadKey;
    onLoadMore();
  });
</script>

<div
  bind:this={host}
  class={`maintenance-activity-virtual-rows ${className}`.trim()}
  data-ui-component="maintenance-activity-virtual-rows"
>
  {#if scrollElement}
    <div
      class="maintenance-activity-virtual-rows__content"
      style:height={`${$virtualizer.getTotalSize()}px`}
    >
      {#each $virtualizer.getVirtualItems() as virtualRow (virtualRow.key)}
        {@const item = rows[virtualRow.index]}
        {#if item}
          <div
            class="maintenance-activity-virtual-rows__row"
            data-ui-part="virtual-row"
            data-index={virtualRow.index}
            data-row-id={getKey(item, virtualRow.index)}
            style:transform={`translateY(${virtualRow.start - $virtualizer.options.scrollMargin}px)`}
            use:measure
          >
            {@render row(item, virtualRow.index)}
          </div>
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style>
  .maintenance-activity-virtual-rows {
    min-width: 0;
  }

  .maintenance-activity-virtual-rows__content {
    position: relative;
    width: 100%;
  }

  .maintenance-activity-virtual-rows__row {
    position: absolute;
    inset-block-start: 0;
    inset-inline: 0;
    width: 100%;
  }
</style>
