<script lang="ts">
  import * as ScrollArea from "@lapismd/design-core/shadcn/scroll-area";
  import * as Empty from "@lapismd/design-core/shadcn/empty";
  import { Skeleton } from "@lapismd/design-core/shadcn/skeleton";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Activity, RotateCcw, History } from "@lucide/svelte";
  import { untrack } from "svelte";
  import type { ActivityQuery } from "../../maintenance/activity/types";
  import type { ActivityController } from "../../maintenance/activity/controller.svelte";
  import ActivityVirtualRows from "./ActivityVirtualRows.svelte";
  import ActivityEntry from "./ActivityEntry.svelte";
  import "./feed.css";
  let {
    controller,
    onOpen,
    onRepository,
    query,
  }: {
    controller: ActivityController;
    onOpen: (id: string) => void;
    onRepository: (repository: string) => void;
    query: Omit<ActivityQuery, "kinds">;
  } = $props();
  $effect(() => {
    const next = { ...query, kinds: [...controller.kinds] };
    untrack(() => void controller.setQuery(next));
  });
  let viewport = $state<HTMLElement | null>(null);
  let visibleDate = $state("");
  const day = (date: string) =>
    new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
</script>

<section
  class="activity-feed"
  aria-label="Workspace activity"
  aria-busy={controller.pending}
>
  {#if controller.pending && !controller.events.length}
    <div
      class="activity-skeleton"
      role="status"
      aria-label="Loading workspace activity"
    >
      {#each [1, 2, 3] as row (row)}<div>
          <Skeleton style="width:2.25rem;height:2.25rem;border-radius:50%" />
          <div>
            <Skeleton style="width:60%;height:0.9rem" /><Skeleton
              style="width:90%;height:2.5rem;margin-top:1rem"
            />
          </div>
        </div>{/each}
    </div>
  {:else if controller.error && !controller.events.length}
    <Empty.Root
      ><Empty.Header
        ><Empty.Media variant="icon"><Activity /></Empty.Media><Empty.Title
          >Activity unavailable</Empty.Title
        ><Empty.Description>{controller.error}</Empty.Description></Empty.Header
      ><Empty.Content
        ><Button variant="outline" onclick={() => controller.retry()}
          ><RotateCcw size={15} aria-hidden="true" />Retry activity</Button
        ></Empty.Content
      ></Empty.Root
    >
  {:else}
    <ScrollArea.Root
      bind:viewportRef={viewport}
      style="flex:1;min-height:0"
      viewportProps={{
        "aria-label": "Activity timeline viewport",
        role: "region",
        tabindex: 0,
        onscroll: () => {
          controller.scrollOffset = viewport?.scrollTop ?? 0;
        },
      }}
    >
      <div class="activity-feed-content">
        {#if controller.events.length}
          <h2
            class="activity-day activity-day-sticky"
            aria-label="Current activity date"
          >
            {visibleDate || day(controller.events[0]!.createdAt)}
          </h2>
          {#key controller.filterVersion}
            <div role="list" aria-label="Workspace activity events">
              <ActivityVirtualRows
                {viewport}
                initialOffset={controller.scrollOffset}
                rows={controller.events}
                estimateSize={(event) =>
                  event && event.body.length > 100 ? 190 : 155}
                overscan={6}
                cursorForRow={(event) => day(event.createdAt)}
                onVisibleCursorChange={(date) => (visibleDate = date ?? "")}
                hasMore={!!controller.nextCursor && !controller.error}
                loading={controller.pending}
                onLoadMore={() => controller.loadMore()}
              >
                {#snippet row(event, index)}
                  <div
                    role="listitem"
                    aria-posinset={index + 1}
                    aria-setsize={controller.totalKnown ? controller.total : -1}
                  >
                    {#if index > 0 && day(event.createdAt) !== day(controller.events[index - 1]!.createdAt)}<h2
                        class="activity-day"
                      >
                        {day(event.createdAt)}
                      </h2>{/if}
                    <ActivityEntry
                      {event}
                      repository={event.repository}
                      status={event.status}
                      onOpen={event.itemId
                        ? () => onOpen(event.itemId)
                        : undefined}
                      onRepository={() => onRepository(event.repository)}
                      connect={index < controller.events.length - 1}
                    />
                  </div>
                {/snippet}
              </ActivityVirtualRows>
            </div>
          {/key}
          <footer class="activity-feed-edge">
            {#if controller.error}<p role="alert">{controller.error}</p>
              <Button variant="outline" onclick={() => controller.retry()}
                ><RotateCcw size={15} aria-hidden="true" />Retry activity</Button
              >
            {:else if controller.nextCursor}<Button
                variant="outline"
                disabled={controller.pending}
                onclick={() => controller.loadMore()}
                ><History size={15} aria-hidden="true" />Load older activity</Button
              >
            {:else}<p>Available activity loaded</p>{/if}
          </footer>
        {:else}<Empty.Root
            ><Empty.Header
              ><Empty.Media variant="icon"><Activity /></Empty.Media
              ><Empty.Title>No matching activity</Empty.Title><Empty.Description
                >Try another repository, status, search or event type.</Empty.Description
              ></Empty.Header
            ></Empty.Root
          >{/if}
      </div>
    </ScrollArea.Root>
  {/if}
</section>
