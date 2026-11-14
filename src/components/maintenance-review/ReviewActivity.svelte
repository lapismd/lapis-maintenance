<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Empty from "@lapismd/design-core/shadcn/empty";
  import {
    MessageSquare,
    GitCommitHorizontal,
    GitPullRequestArrow,
    ShieldCheck,
    Activity,
    ExternalLink,
  } from "@lucide/svelte";
  import ReviewResource from "./ReviewResource.svelte";
  import type { ReviewController } from "../../maintenance/review/controller.svelte";
  import "./review.css";
  let { controller }: { controller: ReviewController } = $props();
</script>

<ReviewResource
  state={controller.resources.activity}
  label="Activity"
  onRetry={() => controller.load("activity")}
>
  <div class="review-activity">
    <header class="review-section-heading">
      <Activity size={16} aria-hidden="true" />
      <h2>Conversation and activity</h2>
      <span class="review-muted">Latest updates for this pull request</span>
    </header>
    <ol class="review-timeline" aria-label="Pull request activity">
      {#each controller.resources.activity.data?.items ?? [] as event (event.id)}<li
        >
          <span class="review-timeline-icon" data-kind={event.kind}
            >{#if event.kind === "commit"}<GitCommitHorizontal
                size={17}
                aria-hidden="true"
              />{:else if event.kind === "review"}<GitPullRequestArrow
                size={17}
                aria-hidden="true"
              />{:else if event.kind === "deployment"}<ShieldCheck
                size={17}
                aria-hidden="true"
              />{:else}<MessageSquare size={17} aria-hidden="true" />{/if}</span
          >
          <article>
            <header>
              <strong>{event.actor}</strong><span>{event.title}</span><a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open activity: ${event.title}`}
                ><ExternalLink size={12} aria-hidden="true" /></a
              ><small>{event.time}</small>
            </header>
            <p>{event.body}</p>
          </article>
        </li>{:else}<li class="review-timeline-empty">
          <Empty.Root
            ><Empty.Header
              ><Empty.Media variant="icon"><Activity /></Empty.Media
              ><Empty.Title>No activity yet</Empty.Title><Empty.Description
                >Conversation and review updates will appear here.</Empty.Description
              ></Empty.Header
            ></Empty.Root
          >
        </li>{/each}
    </ol>
    {#if controller.resources.activity.data?.next}<Button
        variant="outline"
        disabled={controller.resources.activity.loading}
        onclick={() =>
          controller.load("activity", controller.resources.activity.data?.next)}
        >Load older activity</Button
      >{/if}
  </div>
</ReviewResource>
