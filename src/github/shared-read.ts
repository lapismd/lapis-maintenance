export interface SharedRead<T> {
  promise: Promise<T>;
  signal: AbortSignal;
  abort: AbortController;
  subscribers: number;
  settled: boolean;
}
/** One abandoned hover must not cancel another caller's selected-item read. */
export function subscribeRead<T>(
  entry: SharedRead<T>,
  signal: AbortSignal,
): Promise<T> {
  entry.subscribers++;
  return new Promise<T>((resolve, reject) => {
    let finished = false;
    const cleanup = () => {
      if (finished) return;
      finished = true;
      signal.removeEventListener("abort", aborted);
      entry.subscribers--;
      if (!entry.settled && entry.subscribers === 0) entry.abort.abort();
    };
    const aborted = () => {
      cleanup();
      reject(signal.reason);
    };
    if (signal.aborted) {
      aborted();
      return;
    }
    signal.addEventListener("abort", aborted, { once: true });
    entry.promise.then(
      (value) => {
        if (!finished) {
          cleanup();
          resolve(value);
        }
      },
      (error) => {
        if (!finished) {
          cleanup();
          reject(error);
        }
      },
    );
  });
}
