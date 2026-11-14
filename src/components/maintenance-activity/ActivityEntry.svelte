<script lang="ts">
  import { Avatar } from "@lapismd/design-core/shadcn/avatar";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import {
    ExternalLink,
    Eye,
    FolderGit2,
    CircleCheck,
    CircleX,
  } from "@lucide/svelte";
  import ActivityStatus from "./ActivityStatus.svelte";
  import type { ItemStatus } from "../../maintenance/types";
  import type { ActivityEntryContent } from "../../maintenance/activity/types";
  import "./entry.css";
  let {
    event,
    repository,
    status,
    onOpen,
    onRepository,
    connect = true,
  }: {
    event: ActivityEntryContent;
    repository?: string;
    status?: ItemStatus;
    onOpen?: () => void;
    onRepository?: () => void;
    connect?: boolean;
  } = $props();
</script>

<div class="activity-entry" class:activity-entry-connected={connect}>
  <span class="activity-entry-avatar"
    ><Avatar
      src={event.avatarUrl}
      name={event.actor}
      style="--ui-avatar-size:2.25rem"
      decorative
    /></span
  >
  <article data-outcome={event.outcome}>
    <header>
      <div class="activity-entry-byline">
        <strong>{event.actor}</strong><span>{event.title}</span><a
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open activity: ${event.title}`}
          ><ExternalLink size={12} aria-hidden="true" /></a
        >
      </div>
      <small
        >{event.time}{#if event.outcome}<span class="activity-entry-outcome"
            >{#if event.outcome === "success"}<CircleCheck
                size={12}
                aria-hidden="true"
              />Success{:else}<CircleX
                size={12}
                aria-hidden="true"
              />Failed{/if}</span
          >{/if}</small
      >
    </header>
    <p>{event.body}</p>
    {#if repository}<div class="activity-entry-context">
        {#if onRepository}<Button
            variant="outline"
            size="xs"
            style="border-radius:999px"
            onclick={onRepository}
            aria-label={`View repository: ${repository}`}
            ><FolderGit2 aria-hidden="true" />{repository}</Button
          >{:else}<Badge variant="outline">{repository}</Badge
          >{/if}{#if status}<ActivityStatus {status} />{/if}{#if onOpen}<Button
            variant="ghost"
            size="icon-sm"
            title="View details"
            onclick={onOpen}
            aria-label={`View details: ${event.body}`}
            ><Eye aria-hidden="true" /></Button
          >{/if}
      </div>{/if}
  </article>
</div>
