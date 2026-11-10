/** Uncached, non-retrying writes. The session owns credentials and disposal. */
export class GithubWriteError extends Error {
  constructor(
    public uncertain: boolean,
    message: string,
  ) {
    super(message);
  }
}
export class GithubWriteTransport {
  #lifetime = new AbortController();
  #pending?: Promise<{ status: number; body: unknown }>;
  constructor(
    private token: string,
    private send: typeof fetch = globalThis.fetch.bind(globalThis),
    private onUnauthorized = () => {},
  ) {}
  submit(path: string, method: "POST" | "PUT", body?: unknown) {
    if (this.#pending || this.#lifetime.signal.aborted)
      return Promise.reject(
        new GithubWriteError(
          false,
          "The session is closed or another action is pending.",
        ),
      );
    const url = new URL(path, "https://api.github.com");
    if (url.origin !== "https://api.github.com" || url.username || url.password)
      return Promise.reject(
        new GithubWriteError(false, "Refused an unexpected API origin."),
      );
    const pending = this.#send(url.href, method, body);
    this.#pending = pending;
    void pending
      .finally(() => {
        if (this.#pending === pending) this.#pending = undefined;
      })
      .catch(() => {});
    return pending;
  }
  async #send(url: string, method: "POST" | "PUT", body: unknown) {
    let response: Response;
    try {
      response = await this.send(url, {
        method,
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.any([
          this.#lifetime.signal,
          AbortSignal.timeout(30_000),
        ]),
        cache: "no-store",
        credentials: "omit",
        redirect: "error",
      });
    } catch {
      throw new GithubWriteError(
        true,
        "The request may have reached GitHub. Inspect the target before taking further action; it will not be replayed.",
      );
    }
    if (response.status === 401) this.onUnauthorized();
    if (!response.ok)
      throw new GithubWriteError(
        response.status >= 500 || response.status === 408,
        `GitHub did not complete the action (HTTP ${response.status}). Check token permissions, repository rules and the current target.`,
      );
    const text = await response.text().catch(() => {
      throw new GithubWriteError(
        true,
        "The response was interrupted. Inspect GitHub; this action will not be replayed.",
      );
    });
    let parsed: unknown;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new GithubWriteError(
          true,
          "GitHub returned an unreadable result. Inspect the target; this action will not be replayed.",
        );
      }
    }
    return { status: response.status, body: parsed };
  }
  dispose() {
    this.#lifetime.abort();
    this.token = "";
  }
  async drain() {
    await this.#pending?.catch(() => {});
  }
}
