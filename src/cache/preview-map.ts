import { MAX_ENTRY_BYTES, recordBytes } from "./limits";
/** Synchronous previews are independently bounded so rich resources cannot grow the heap indefinitely. */
export class PreviewMap<T> extends Map<string, T> {
  #sizes = new Map<string, number>();
  #bytes = 0;
  constructor(
    private count = 100,
    private budget = 5 * 1_048_576,
  ) {
    super();
  }
  override set(key: string, value: T): this {
    this.delete(key);
    const bytes = recordBytes(key, value);
    if (bytes > MAX_ENTRY_BYTES || bytes > this.budget) return this;
    this.#sizes.set(key, bytes);
    this.#bytes += bytes;
    super.set(key, value);
    while (this.size > this.count || this.#bytes > this.budget)
      this.delete(this.keys().next().value!);
    return this;
  }
  override delete(key: string) {
    this.#bytes -= this.#sizes.get(key) ?? 0;
    this.#sizes.delete(key);
    return super.delete(key);
  }
  override clear() {
    this.#bytes = 0;
    this.#sizes.clear();
    super.clear();
  }
}
