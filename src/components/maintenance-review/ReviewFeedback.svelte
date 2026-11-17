<script lang="ts">
  import FeedbackFeed from "../feedback/FeedbackFeed.svelte";
  import { outcomeSeverity } from "../../maintenance/feedback.svelte";
  import type { ReviewController } from "../../maintenance/review/controller.svelte";
  let { controller }: { controller: ReviewController } = $props();
  const feedback = $derived(controller.feedback);
  const targetAction = (url?: string) =>
    url
      ? {
          label: "View on GitHub",
          run: () => {
            window.open(url, "_blank", "noopener,noreferrer");
          },
        }
      : undefined;
</script>

<FeedbackFeed
  scope="review-actions"
  pending={controller.pending}
  notices={feedback
    ? [
        {
          id: `command:${feedback.requestId}`,
          title: `${controller.mode === "live" ? "GitHub" : "Preview"} · ${feedback.result.status}`,
          severity: outcomeSeverity(feedback.result.status),
          message: feedback.result.message,
          action: targetAction(feedback.result.url),
        },
      ]
    : []}
/>
