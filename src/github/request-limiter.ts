export class RequestLimiter {
  #active = 0;
  #waiting: (() => void)[] = [];
  constructor(private limit = 4) {}
  async run<T>(signal: AbortSignal, work: () => Promise<T>): Promise<T> {
    signal.throwIfAborted();
    await new Promise<void>((resolve, reject) => {
      const start = () => {
        signal.removeEventListener("abort", abort);
        this.#active++;
        resolve();
      };
      const abort = () => {
        this.#waiting = this.#waiting.filter((entry) => entry !== start);
        reject(signal.reason);
      };
      signal.addEventListener("abort", abort, { once: true });
      if (this.#active < this.limit) start();
      else this.#waiting.push(start);
    });
    try {
      signal.throwIfAborted();
      return await work();
    } finally {
      this.#active--;
      this.#waiting.shift()?.();
    }
  }
}
