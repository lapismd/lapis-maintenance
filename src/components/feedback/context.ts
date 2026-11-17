import { getContext, setContext, onDestroy } from "svelte";
import { FeedbackCenter } from "../../maintenance/feedback.svelte";
const feedbackKey = Symbol("maintenance-feedback");
export function provideFeedback() {
  const existing = getContext<FeedbackCenter | undefined>(feedbackKey);
  if (existing) return { center: existing, owned: false };
  const center = new FeedbackCenter();
  setContext(feedbackKey, center);
  onDestroy(() => center.dispose());
  return { center, owned: true };
}
