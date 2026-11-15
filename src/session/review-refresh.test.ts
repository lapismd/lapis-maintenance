import { expect, it, vi } from "vitest";
import { startReviewRefresh } from "./review-refresh";
import type { ReviewController } from "../maintenance/review/controller.svelte";
it("refreshes selected pending checks only while visible and releases its timer", async () => {
  vi.useFakeTimers();
  const refresh = vi.fn(),
    review = {
      selectedId: "pr:a/b:1",
      pending: false,
      resources: { checks: { loading: false, data: [{ state: "running" }] } },
      refresh,
    };
  const page = { visibilityState: "hidden" as DocumentVisibilityState },
    stop = startReviewRefresh(review as unknown as ReviewController, page);
  await vi.advanceTimersByTimeAsync(45000);
  expect(refresh).not.toHaveBeenCalled();
  page.visibilityState = "visible";
  await vi.advanceTimersByTimeAsync(45000);
  expect(refresh).toHaveBeenCalledTimes(1);
  review.pending = true;
  await vi.advanceTimersByTimeAsync(45000);
  expect(refresh).toHaveBeenCalledTimes(1);
  stop();
  review.pending = false;
  await vi.advanceTimersByTimeAsync(45000);
  expect(refresh).toHaveBeenCalledTimes(1);
  vi.useRealTimers();
});
