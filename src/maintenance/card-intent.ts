import type { IntentPrefetch } from "./intent-prefetch";
/** Attach app-owned intent to the public semantic card hosting this snippet. */
export function cardIntent(
  node: HTMLElement,
  options: { id: string; prefetch: IntentPrefetch },
) {
  const card = node.closest<HTMLElement>('[role="button"]');
  if (!card) return;
  const enter = () => options.prefetch.enter(options.id);
  const leave = () => options.prefetch.leave(options.id);
  card.addEventListener("pointerenter", enter);
  card.addEventListener("pointerleave", leave);
  card.addEventListener("focusin", enter);
  card.addEventListener("focusout", leave);
  return {
    destroy() {
      leave();
      card.removeEventListener("pointerenter", enter);
      card.removeEventListener("pointerleave", leave);
      card.removeEventListener("focusin", enter);
      card.removeEventListener("focusout", leave);
    },
  };
}
