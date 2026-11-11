import { expect, it, vi } from "vitest";
import { RequestLimiter } from "./request-limiter";

it("removes an aborted promoted read without losing the slot for remaining work", async () => {
  const limiter = new RequestLimiter(1);
  const signal = new AbortController().signal;
  let release!: () => void;
  const active = limiter.run(
    signal,
    () =>
      new Promise<void>((resolve) => {
        release = resolve;
      }),
  );
  await vi.waitFor(() => expect(release).toBeDefined());
  const aborted = new AbortController();
  const work = vi.fn(async () => "cancelled");
  const queued = limiter.run(aborted.signal, work);
  limiter.promote(aborted.signal);
  aborted.abort();
  await expect(queued).rejects.toThrow();
  const next = limiter.run(signal, async () => "remaining");
  release();
  await active;
  expect(await next).toBe("remaining");
  expect(work).not.toHaveBeenCalled();
});
