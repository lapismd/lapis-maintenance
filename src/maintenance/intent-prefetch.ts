/** One disposable intent timer; selected readers share provider work independently. */
export class IntentPrefetch {
  #timer?: ReturnType<typeof setTimeout>;
  #request?: AbortController;
  #id?: string;
  constructor(
    private load: (id: string, signal: AbortSignal) => Promise<unknown>,
    private delay = 150,
  ) {}
  enter(id: string) {
    if (this.#id === id) return;
    this.leave();
    this.#id = id;
    this.#timer = setTimeout(() => {
      this.#timer = undefined;
      this.#request = new AbortController();
      void this.load(id, this.#request.signal).catch(() => {});
    }, this.delay);
  }
  leave(id?: string) {
    if (id && id !== this.#id) return;
    clearTimeout(this.#timer);
    this.#request?.abort();
    this.#timer = undefined;
    this.#request = undefined;
    this.#id = undefined;
  }
  dispose() {
    this.leave();
  }
}
