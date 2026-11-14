import type { ReviewController } from "../maintenance/review/controller.svelte";
export function startReviewRefresh(
  review: ReviewController,
  page: Pick<Document, "visibilityState"> = document,
) {
  const timer = setInterval(() => {
    if (
      page.visibilityState !== "visible" ||
      !review.selectedId ||
      review.pending ||
      review.resources.checks.loading
    )
      return;
    if (
      review.resources.checks.data?.some(
        (c) => c.state === "running" || c.state === "queued",
      )
    )
      void review.refresh();
  }, 45000);
  return () => clearInterval(timer);
}
