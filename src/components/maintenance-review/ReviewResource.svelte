<script lang="ts">
  import type { Snippet } from "svelte";
  import { Skeleton } from "@lapismd/design-core/shadcn/skeleton";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Empty from "@lapismd/design-core/shadcn/empty";
  import { CircleAlert, LoaderCircle, RotateCcw } from "@lucide/svelte";
  import type { ResourceState } from "../../maintenance/review/types";
  import "./review.css";
  import FeedbackFeed from "../feedback/FeedbackFeed.svelte";
  let {
    state,
    resourceKey = "resource",
    label,
    onRetry,
    children,
  }: {
    state: ResourceState<unknown>;
    resourceKey?: string;
    label: string;
    onRetry: () => void;
    children: Snippet;
  } = $props();
</script>

<FeedbackFeed
  scope={`review-resource:${label}`}
  pending={state.loading}
  notices={state.error
    ? [
        {
          id: `review-resource:${resourceKey}:${label}`,
          title: `Could not refresh ${label.toLowerCase()}`,
          message: state.error,
          severity: "error",
          action: { label: "Retry", run: onRetry },
        },
      ]
    : []}
/>

{#if state.loading && !state.data}
  <div class="review-skeleton" role="status" aria-label={`Loading ${label}`}>
    <Skeleton style="height:1.3rem;width:45%" />
    {#each [1, 2, 3] as index (index)}<Skeleton
        style="height:4rem;width:100%"
      />{/each}
  </div>
{:else if state.error && !state.data}
  <Empty.Root
    ><Empty.Header
      ><Empty.Media variant="icon"><CircleAlert /></Empty.Media><Empty.Title
        >{label} unavailable</Empty.Title
      ><Empty.Description>Try loading this resource again.</Empty.Description
      ></Empty.Header
    ><Empty.Content
      ><Button variant="outline" onclick={onRetry}
        ><RotateCcw size={15} aria-hidden="true" />Retry {label.toLowerCase()}</Button
      ></Empty.Content
    ></Empty.Root
  >
{:else}
  {#if state.loading}<div class="review-refreshing" role="status">
      <LoaderCircle
        size={14}
        class="review-spinner"
        aria-hidden="true"
      />Refreshing {label.toLowerCase()}
    </div>{/if}
  {@render children()}
{/if}
