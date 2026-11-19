<script lang="ts">
  import { onMount } from "svelte";
  import {
    checkDurationMilliseconds,
    formatCheckDuration,
  } from "../../maintenance/check-duration";

  let {
    startedAt,
    completedAt,
    running = false,
  }: {
    startedAt?: string;
    completedAt?: string;
    running?: boolean;
  } = $props();
  let now = $state(Date.now());
  const duration = $derived(
    checkDurationMilliseconds(startedAt, completedAt, now),
  );
  const label = $derived(
    duration === undefined ? undefined : formatCheckDuration(duration),
  );

  onMount(() => {
    if (!running || completedAt || !startedAt) return;
    const timer = window.setInterval(() => (now = Date.now()), 1000);
    return () => window.clearInterval(timer);
  });
</script>

{#if label}<time
    class="review-check-duration"
    datetime={completedAt ?? startedAt}
    title={running ? `Running for ${label}` : `Completed in ${label}`}
    aria-label={running ? `Elapsed ${label}` : `Duration ${label}`}
    >{label}</time
  >{/if}
