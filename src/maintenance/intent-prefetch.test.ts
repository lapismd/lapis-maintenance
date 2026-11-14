import { afterEach, expect, it, vi } from "vitest";
import { IntentPrefetch } from "./intent-prefetch";
afterEach(() => vi.useRealTimers());
it("waits for intent, cancels short hovers and bounds active prefetches", async () => {
  vi.useFakeTimers();
  const signals: AbortSignal[] = [];
  const load = vi.fn(async (_id: string, signal: AbortSignal) => {
      signals.push(signal);
    }),
    intent = new IntentPrefetch(load);
  intent.enter("a");
  await vi.advanceTimersByTimeAsync(149);
  expect(load).not.toHaveBeenCalled();
  intent.leave("a");
  await vi.advanceTimersByTimeAsync(10);
  expect(load).not.toHaveBeenCalled();
  intent.enter("b");
  await vi.advanceTimersByTimeAsync(150);
  expect(load).toHaveBeenCalledOnce();
  intent.enter("b");
  await vi.advanceTimersByTimeAsync(150);
  expect(load).toHaveBeenCalledOnce();
  intent.enter("c");
  expect(signals[0]!.aborted).toBe(true);
  intent.dispose();
  await vi.advanceTimersByTimeAsync(150);
  expect(load).toHaveBeenCalledOnce();
});
