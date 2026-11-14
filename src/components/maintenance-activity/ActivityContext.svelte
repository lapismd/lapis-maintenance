<script lang="ts">
  import type { Snippet } from "svelte";
  import { LoaderCircle } from "@lucide/svelte";
  import type { ActivityController } from "../../maintenance/activity/controller.svelte";
  import ActivityFilter from "./ActivityFilter.svelte";
  import "./feed.css";
  let {
    controller,
    controls,
  }: { controller: ActivityController; controls?: Snippet } = $props();
</script>

<div class="activity-context">
  <div>
    <h1>Activity</h1>
    <p>
      {controller.pending && !controller.events.length
        ? "Loading activity…"
        : controller.totalKnown
          ? `${controller.events.length} of ${controller.total} events loaded`
          : `${controller.events.length} events loaded`}
    </p>
  </div>
  {#if controller.pending && controller.events.length}<span
      class="activity-refreshing"
      role="status"
      ><LoaderCircle size={14} aria-hidden="true" />{controller.refreshing
        ? "Refreshing activity"
        : "Loading older activity"}</span
    >{/if}
  <ActivityFilter {controller} />
  {@render controls?.()}
</div>
