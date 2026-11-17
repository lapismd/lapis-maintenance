<script lang="ts">
  import { untrack } from "svelte";
  import type { FeedbackNotice } from "../../maintenance/feedback.svelte";
  import { provideFeedback } from "./context";
  import FeedbackHost from "./FeedbackHost.svelte";
  let {
    scope,
    notices,
    pending = false,
  }: {
    scope: string;
    notices: readonly FeedbackNotice[];
    pending?: boolean;
  } = $props();
  const feedback = provideFeedback();
  $effect(() => {
    const next = notices,
      key = scope,
      busy = pending;
    untrack(() => feedback.center.sync(key, next, busy));
  });
</script>

{#if feedback.owned}<FeedbackHost center={feedback.center} />{/if}
