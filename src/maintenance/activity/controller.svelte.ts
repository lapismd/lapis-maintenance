import type {
  ActivityEvent,
  ActivityKind,
  ActivityPage,
  ActivityQuery,
  ActivityReadPort,
} from "./types";
export class ActivityController {
  events = $state.raw<ActivityEvent[]>([]);
  query = $state.raw<ActivityQuery>({
    search: "",
    repositories: [],
    statuses: [],
    kinds: [],
  });
  kinds = $state<ActivityKind[]>([]);
  pending = $state(false);
  error = $state<string | null>(null);
  total = $state(0);
  nextCursor = $state<string | undefined>();
  filterVersion = $state(0);
  scrollOffset = 0;
  #key = "";
  #generation = 0;
  #disposed = false;
  #request?: AbortController;
  #mode = $state<"refresh" | "page">("refresh");
  #failedCursor?: string;
  constructor(private read: ActivityReadPort) {}
  get refreshing() {
    return this.pending && this.#mode === "refresh";
  }
  setQuery(query: ActivityQuery): Promise<void> {
    if (this.#disposed) return Promise.resolve();
    const normalized = {
      search: query.search.trim().toLowerCase(),
      repositories: [...new Set(query.repositories)].sort(),
      statuses: [...new Set(query.statuses)].sort(),
      kinds: [...new Set(query.kinds)].sort(),
    };
    const key = JSON.stringify(normalized);
    if (key === this.#key) return Promise.resolve();
    this.#key = key;
    this.query = normalized;
    this.events = [];
    this.total = 0;
    this.nextCursor = undefined;
    this.scrollOffset = 0;
    this.filterVersion++;
    return this.refresh();
  }
  refresh(): Promise<void> {
    if (this.#disposed || !this.#key) return Promise.resolve();
    this.#request?.abort();
    return this.#load(undefined, ++this.#generation);
  }
  loadMore(): Promise<void> {
    if (this.#disposed || this.pending || !this.nextCursor)
      return Promise.resolve();
    return this.#load(this.nextCursor, this.#generation);
  }
  retry(): Promise<void> {
    return this.#failedCursor ? this.loadMore() : this.refresh();
  }
  async #load(cursor: string | undefined, generation: number) {
    const request = new AbortController();
    this.#request = request;
    this.#mode = cursor ? "page" : "refresh";
    this.pending = true;
    this.error = null;
    try {
      const page: ActivityPage = await this.read.readPage(
        this.query,
        cursor,
        request.signal,
      );
      if (!this.#current(generation, request)) return;
      this.events = [
        ...new Map(
          [...(cursor ? this.events : []), ...page.events].map((event) => [
            event.id,
            event,
          ]),
        ).values(),
      ];
      this.total = page.total;
      this.nextCursor = page.nextCursor;
      this.#failedCursor = undefined;
    } catch (error) {
      if (!this.#current(generation, request)) return;
      this.#failedCursor = cursor;
      this.error =
        error instanceof Error
          ? error.message
          : "Activity could not be loaded.";
    } finally {
      if (this.#current(generation, request)) this.pending = false;
    }
  }
  #current(generation: number, request: AbortController) {
    return (
      !this.#disposed &&
      !request.signal.aborted &&
      generation === this.#generation &&
      request === this.#request
    );
  }
  dispose() {
    this.#disposed = true;
    this.#request?.abort();
    this.pending = false;
  }
}
