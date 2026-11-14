import type { MaintenanceSnapshot } from "../maintenance/types";
import type { CachedResponse, ResponseCache } from "../cache/response-cache";
import { RequestLimiter, type ReadPriority } from "./request-limiter";
import { GithubError } from "./read-errors";
import { fetchReadResponse } from "./read-response";
import { subscribeRead, type SharedRead } from "./shared-read";
import { validRepository } from "./models";
export { GithubError } from "./read-errors";
export interface ReadOptions {
  priority?: ReadPriority;
  force?: boolean;
  fresh?: boolean;
  ttl?: number;
  accept?: string;
  onObservation?: (validatedAt: number) => void;
  onProgress?: (snapshot: MaintenanceSnapshot) => void;
}
interface Query {
  repository: string;
  query: string;
  variables: Record<string, unknown>;
}
export class GithubTransport {
  #lifetime = new AbortController();
  #limiter = new RequestLimiter(4);
  #pending = new Map<string, SharedRead<CachedResponse>>();
  #blockedUntil = 0;
  #writing: Promise<void> = Promise.resolve();
  #repositoryEpoch = new Map<string, number>();
  invalidateRepository(repository: string) {
    const key = repository.toLowerCase();
    this.#repositoryEpoch.set(key, (this.#repositoryEpoch.get(key) ?? 0) + 1);
  }
  constructor(
    private token: string,
    private cache: ResponseCache,
    private send: typeof fetch = globalThis.fetch.bind(globalThis),
    private now = Date.now,
    private onUnauthorized = () => {},
  ) {}
  async read<T>(
    path: string,
    signal: AbortSignal,
    options: ReadOptions = {},
  ): Promise<T> {
    const value = await this.#response(path, signal, options);
    options.onObservation?.(value.fetchedAt);
    return value.body as T;
  }
  /** A separate query-only path; mutations can only use the non-retrying writer. */
  async query<T>(
    repository: string,
    query: string,
    variables: Record<string, unknown>,
    signal: AbortSignal,
    options: ReadOptions = {},
  ): Promise<T> {
    if (!validRepository(repository) || !/^\s*query\b/.test(query))
      throw new GithubError(
        0,
        "Only named read-only GraphQL queries are allowed here.",
      );
    const value = await this.#response("/graphql", signal, options, {
      repository,
      query,
      variables,
    });
    options.onObservation?.(value.fetchedAt);
    return value.body as T;
  }
  async page<T>(
    path: string,
    signal: AbortSignal,
    options: ReadOptions = {},
    field?: string,
  ): Promise<{ items: T[]; next?: string }> {
    const value = await this.#response(path, signal, options);
    options.onObservation?.(value.fetchedAt);
    const items = field
      ? (value.body as Record<string, unknown>)[field]
      : value.body;
    if (!Array.isArray(items))
      throw new GithubError(0, "GitHub returned an unexpected list response.");
    return { items: items as T[], next: value.next };
  }
  async pages<T>(
    path: string,
    signal: AbortSignal,
    options: ReadOptions = {},
    field?: string,
  ): Promise<T[]> {
    const all: T[] = [],
      seen = new Set<string>();
    let next: string | undefined = path;
    while (next) {
      if (seen.has(next) || seen.size >= 100)
        throw new GithubError(
          0,
          "Pagination did not finish; coverage is incomplete.",
        );
      seen.add(next);
      const response = await this.#response(next, signal, options);
      options.onObservation?.(response.fetchedAt);
      const page = field
        ? (response.body as Record<string, unknown>)[field]
        : response.body;
      if (!Array.isArray(page))
        throw new GithubError(
          0,
          "GitHub returned an unexpected list response.",
        );
      all.push(...(page as T[]));
      next = response.next;
    }
    return all;
  }
  async #response(
    path: string,
    signal: AbortSignal,
    options: ReadOptions,
    query?: Query,
  ): Promise<CachedResponse> {
    const url = new URL(path, "https://api.github.com");
    if (url.origin !== "https://api.github.com" || url.username || url.password)
      throw new GithubError(0, "Refused an unexpected API origin.");
    const repository = (
      query?.repository ??
      url.pathname.match(/^\/repos\/([^/]+\/[^/]+)(?:\/|$)/)?.[1] ??
      ""
    ).toLowerCase();
    const key = query
      ? `json:/repos/${query.repository}/graphql:${JSON.stringify([query.query, query.variables])}`
      : `${options.accept ?? "json"}:${url.pathname}${url.search}`;
    const epoch = this.#repositoryEpoch.get(repository) ?? 0;
    const priority =
      options.priority ?? (options.fresh ? "interactive" : "background");
    const consumer = AbortSignal.any([signal, this.#lifetime.signal]);
    consumer.throwIfAborted();
    const cached = options.fresh ? undefined : await this.cache.get(key);
    consumer.throwIfAborted();
    if (epoch !== (this.#repositoryEpoch.get(repository) ?? 0))
      return this.#response(path, signal, options, query);
    if (
      cached &&
      !options.force &&
      this.now() - cached.fetchedAt < (options.ttl ?? 300_000)
    )
      return cached;
    if (this.now() < this.#blockedUntil)
      throw new GithubError(
        429,
        "GitHub requests are paused until the rate limit resets.",
        this.#blockedUntil,
      );
    const pendingKey = `${key}:${options.fresh ? "fresh" : "cached"}:${epoch}`;
    let entry = this.#pending.get(pendingKey);
    if (!entry || entry.signal.aborted) {
      const abort = new AbortController(),
        network = AbortSignal.any([abort.signal, this.#lifetime.signal]);
      const pending = this.#limiter.run(
        network,
        async () => {
          if (this.now() < this.#blockedUntil)
            throw new GithubError(
              429,
              "GitHub requests are paused until the rate limit resets.",
              this.#blockedUntil,
            );
          try {
            const value = await fetchReadResponse(
              this.send,
              this.token,
              url.href,
              network,
              this.now,
              options.accept,
              cached,
              options.fresh,
              query,
              this.onUnauthorized,
              (until) => {
                this.#blockedUntil = until;
              },
            );
            network.throwIfAborted();
            if (
              !options.fresh &&
              epoch === (this.#repositoryEpoch.get(repository) ?? 0)
            ) {
              this.#writing = this.#writing
                .catch(() => {})
                .then(async () => {
                  if (
                    this.#lifetime.signal.aborted ||
                    epoch !== (this.#repositoryEpoch.get(repository) ?? 0)
                  )
                    return;
                  if (value.cacheable === false) await this.cache.remove(key);
                  else await this.cache.put(key, value);
                  if (
                    this.#lifetime.signal.aborted ||
                    epoch !== (this.#repositoryEpoch.get(repository) ?? 0)
                  )
                    await this.cache.remove(key);
                })
                .catch(() => {});
            }
            return value;
          } catch (error) {
            if (error instanceof GithubError && error.discardPreview)
              await this.cache.remove(key);
            throw error;
          }
        },
        priority,
      );
      entry = {
        promise: pending,
        signal: network,
        abort,
        subscribers: 0,
        settled: false,
      };
      this.#pending.set(pendingKey, entry);
      const current = entry;
      void pending
        .finally(() => {
          current.settled = true;
          if (this.#pending.get(pendingKey) === current)
            this.#pending.delete(pendingKey);
        })
        .catch(() => {});
    }
    if (priority === "interactive") this.#limiter.promote(entry.signal);
    return subscribeRead(entry, consumer);
  }
  dispose() {
    this.#lifetime.abort();
    this.token = "";
  }
  async drain() {
    await Promise.allSettled(
      [...this.#pending.values()].map((value) => value.promise),
    );
    await this.#writing;
  }
}
