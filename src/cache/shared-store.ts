import type { ResponseCache } from "./response-cache";
/** Serialize the last close with the next open; one WASM connection per app realm. */
export class SharedCacheStore {
  #store?: ResponseCache;
  #references = 0;
  #tail = Promise.resolve();
  constructor(private open: () => Promise<ResponseCache>) {}
  #run<T>(work: () => Promise<T>) {
    const pending = this.#tail.catch(() => {}).then(work);
    this.#tail = pending.then(
      () => {},
      () => {},
    );
    return pending;
  }
  acquire() {
    return this.#run(async () => {
      const store = (this.#store ??= await this.open());
      this.#references++;
      let released = false;
      return {
        store,
        release: () =>
          this.#run(async () => {
            if (released) return;
            released = true;
            if (--this.#references === 0) {
              this.#store = undefined;
              await store.close();
            }
          }),
      };
    });
  }
}
