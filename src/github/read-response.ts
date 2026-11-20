import type { CachedResponse } from "../cache/response-cache";
import { GithubError } from "./read-errors";
export interface ReadResponse extends CachedResponse {
  cacheable?: boolean;
}
export async function fetchReadResponse(
  send: typeof fetch,
  token: string,
  url: string,
  signal: AbortSignal,
  now: () => number,
  accept: string | undefined,
  cached: CachedResponse | undefined,
  fresh: boolean | undefined,
  query: { query: string; variables: Record<string, unknown> } | undefined,
  unauthorized: () => void,
  block: (until: number) => void,
): Promise<ReadResponse> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: accept ?? "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (query) headers["Content-Type"] = "application/json";
  if (!query && cached?.etag && !fresh) headers["If-None-Match"] = cached.etag;
  const response = await send(url, {
    method: query ? "POST" : "GET",
    headers,
    body: query ? JSON.stringify(query) : undefined,
    signal: AbortSignal.any([signal, AbortSignal.timeout(30_000)]),
    cache: "no-store",
    credentials: "omit",
    redirect: "error",
  });
  signal.throwIfAborted();
  const rateLimited = () => {
    const retry = response.headers.get("retry-after"),
      reset = Number(response.headers.get("x-ratelimit-reset")) * 1000;
    const until = Math.max(
      now() + 60_000,
      Number.isFinite(reset) ? reset : 0,
      retry && Number.isFinite(Number(retry))
        ? now() + Number(retry) * 1000
        : retry && Number.isFinite(Date.parse(retry))
          ? Date.parse(retry)
          : 0,
    );
    block(until);
    return new GithubError(
      response.status >= 400 ? response.status : 429,
      `GitHub rate limit reached. Refresh after ${new Date(until).toISOString()}.`,
      until,
    );
  };
  if (response.status === 401) unauthorized();
  if (!response.ok && response.status !== 304) {
    if (
      response.status === 429 ||
      response.headers.get("retry-after") ||
      response.headers.get("x-ratelimit-remaining") === "0"
    )
      throw rateLimited();
    throw new GithubError(
      response.status,
      response.status === 401
        ? "GitHub rejected this token. Sign in again."
        : response.status === 403
          ? "GitHub denied access (HTTP 403). Check token permissions and repository access."
          : response.status === 404
            ? "GitHub resource not found or inaccessible (HTTP 404)."
            : response.status === 422
              ? "GitHub could not resolve the requested resource reference (HTTP 422)."
              : `GitHub data unavailable (HTTP ${response.status}).`,
    );
  }
  if (response.status === 304 && cached) return { ...cached, fetchedAt: now() };
  const body = await response.json();
  signal.throwIfAborted();
  if (query && Array.isArray(body?.errors)) {
    if (
      body.errors.some(
        (error: { type?: string }) => error.type === "RATE_LIMITED",
      )
    )
      throw rateLimited();
    if (
      body.errors.some((error: { type?: string }) =>
        ["UNAUTHENTICATED", "BAD_CREDENTIALS"].includes(error.type ?? ""),
      )
    ) {
      unauthorized();
      throw new GithubError(401, "GitHub rejected this token. Sign in again.");
    }
  }
  return {
    body,
    fetchedAt: now(),
    etag: query ? undefined : (response.headers.get("etag") ?? undefined),
    next: response.headers.get("link")?.match(/<([^>]+)>;\s*rel="next"/)?.[1],
    cacheable: !query || !body?.errors?.length,
  };
}
