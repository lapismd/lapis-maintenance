<script lang="ts">
  import { CircleCheck, CircleAlert, ExternalLink } from "@lucide/svelte";
  import type { ReviewController } from "../../maintenance/review/controller.svelte";
  import "./review.css";
  let { controller }: { controller: ReviewController } = $props();
  const feedback = $derived(controller.feedback);
</script>

{#if feedback}
  <div
    class="review-feedback"
    data-state={feedback.result.status}
    role="status"
  >
    {#if ["completed", "accepted"].includes(feedback.result.status)}<CircleCheck
        size={18}
        aria-hidden="true"
      />{:else}<CircleAlert size={18} aria-hidden="true" />{/if}
    <div>
      <strong>Preview · {feedback.result.status}</strong>
      <p>{feedback.result.message}</p>
      {#if feedback.result.url}<a
          href={feedback.result.url}
          target="_blank"
          rel="noopener noreferrer"
          >View target on GitHub <ExternalLink
            size={12}
            aria-hidden="true"
          /></a
        >{/if}
    </div>
  </div>
{/if}
