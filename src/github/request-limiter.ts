export type ReadPriority = "interactive" | "background";
interface WaitingRead {
  signal: AbortSignal;
  start: () => void;
}
export class RequestLimiter {
  #active = 0;
  #waiting: WaitingRead[] = [];
  #interactive: WaitingRead[] = [];
  constructor(private limit = 4) {}
  promote(signal: AbortSignal) {
    const index = this.#waiting.findIndex((entry) => entry.signal === signal);
    if (index >= 0) this.#interactive.push(this.#waiting.splice(index, 1)[0]!);
  }
  async run<T>(
    signal: AbortSignal,
    work: () => Promise<T>,
    priority: ReadPriority = "background",
  ): Promise<T> {
    signal.throwIfAborted();
    await new Promise<void>((resolve, reject) => {
      const start = () => {
        signal.removeEventListener("abort", abort);
        this.#active++;
        resolve();
      };
      const abort = () => {
        this.#waiting = this.#waiting.filter((entry) => entry.start !== start);
        this.#interactive = this.#interactive.filter(
          (entry) => entry.start !== start,
        );
        reject(signal.reason);
      };
      signal.addEventListener("abort", abort, { once: true });
      if (this.#active < this.limit) start();
      else
        (priority === "interactive" ? this.#interactive : this.#waiting).push({
          signal,
          start,
        });
    });
    try {
      signal.throwIfAborted();
      return await work();
    } finally {
      this.#active--;
      (this.#interactive.shift() ?? this.#waiting.shift())?.start();
    }
  }
}
