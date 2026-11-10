import { MaintenanceReadError } from "../maintenance/types";
import type { MaintenanceSnapshot } from "../maintenance/types";
import type { CachedResponse, ResponseCache } from "../cache/response-cache";
import { RequestLimiter } from "./request-limiter";
export class GithubError extends MaintenanceReadError {
  constructor(
    public status: number,
    message: string,
    public retryAt?: number,
  ) {
    super(message, retryAt ? "rate-limit" : "unavailable");
  }
}
export interface ReadOptions {
  force?: boolean;
  fresh?: boolean;
  ttl?: number;
  accept?: string;
  onObservation?: (validatedAt: number) => void;
  onProgress?: (snapshot: MaintenanceSnapshot) => void;
}
export class GithubTransport {
  #lifetime = new AbortController();
  #limiter = new RequestLimiter(4);
  #pending = new Map<
    string,
    { promise: Promise<CachedResponse>; signal: AbortSignal }
  >();
  #blockedUntil = 0;
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
  async pages<T>(
    path: string,
    signal: AbortSignal,
    options: ReadOptions = {},
    field?: string,
  ): Promise<T[]> {
    const all: T[] = [];
    const seen = new Set<string>();
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
  ): Promise<CachedResponse> {
    const url = new URL(path, "https://api.github.com");
    if (url.origin !== "https://api.github.com" || url.username || url.password)
      throw new GithubError(0, "Refused an unexpected API origin.");
    const key = `${options.accept ?? "json"}:${url.pathname}${url.search}`;
    const combined = AbortSignal.any([signal, this.#lifetime.signal]);
    combined.throwIfAborted();
    const cached = options.fresh ? undefined : await this.cache.get(key);
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
    const pendingKey = `${key}:${options.fresh ? "fresh" : "cached"}`;
    let entry = this.#pending.get(pendingKey);
    if (!entry || entry.signal.aborted) {
      const pending = this.#limiter.run(combined, async () => {
        if (this.now() < this.#blockedUntil)
          throw new GithubError(
            429,
            "GitHub requests are paused until the rate limit resets.",
            this.#blockedUntil,
          );
        const headers: Record<string, string> = {
          Authorization: `Bearer ${this.token}`,
          Accept: options.accept ?? "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        };
        if (cached?.etag && !options.fresh)
          headers["If-None-Match"] = cached.etag;
        const response = await this.send(url.href, {
          method: "GET",
          headers,
          signal: AbortSignal.any([combined, AbortSignal.timeout(30_000)]),
          cache: "no-store",
          credentials: "omit",
        });
        combined.throwIfAborted();
        if (response.status === 401) this.onUnauthorized();
        if (!response.ok && response.status !== 304) {
          const retry = response.headers.get("retry-after");
          if (
            response.status === 429 ||
            retry ||
            response.headers.get("x-ratelimit-remaining") === "0"
          ) {
            const reset =
              Number(response.headers.get("x-ratelimit-reset")) * 1000;
            this.#blockedUntil = Math.max(
              this.now() + 60_000,
              Number.isFinite(reset) ? reset : 0,
              retry && Number.isFinite(Number(retry))
                ? this.now() + Number(retry) * 1000
                : retry && Number.isFinite(Date.parse(retry))
                  ? Date.parse(retry)
                  : 0,
            );
            throw new GithubError(
              response.status,
              `GitHub rate limit reached. Refresh after ${new Date(this.#blockedUntil).toISOString()}.`,
              this.#blockedUntil,
            );
          }
          if (
            response.status === 401 ||
            response.status === 403 ||
            response.status === 404
          )
            await this.cache.remove(key);
          throw new GithubError(
            response.status,
            response.status === 401
              ? "GitHub rejected this token. Sign in again."
              : `GitHub data unavailable (HTTP ${response.status}). Check token permissions and repository access.`,
          );
        }
        const value: CachedResponse =
          response.status === 304 && cached
            ? { ...cached, fetchedAt: this.now() }
            : {
                body: await response.json(),
                fetchedAt: this.now(),
                etag: response.headers.get("etag") ?? undefined,
                next: response.headers
                  .get("link")
                  ?.match(/<([^>]+)>;\s*rel="next"/)?.[1],
              };
        combined.throwIfAborted();
        if (!options.fresh) await this.cache.put(key, value);
        return value;
      });
      entry = { promise: pending, signal: combined };
      this.#pending.set(pendingKey, entry);
      void pending
        .finally(() => {
          if (this.#pending.get(pendingKey)?.promise === pending)
            this.#pending.delete(pendingKey);
        })
        .catch(() => {});
    }
    const value = await entry.promise;
    combined.throwIfAborted();
    return value;
  }
  dispose() {
    this.#lifetime.abort();
    this.token = "";
  }
  async drain() {
    await Promise.allSettled(
      [...this.#pending.values()].map((value) => value.promise),
    );
  }
}
