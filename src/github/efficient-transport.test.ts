import { expect, it, vi } from "vitest";
import { GithubTransport } from "./transport";
import { MemoryResponseCache } from "../cache/response-cache";
it("does not couple cancellation of consumers sharing the same read", async () => {
  let finish!: (response: Response) => void;
  const send = vi.fn<typeof fetch>(
    (_url, init) =>
      new Promise((resolve, reject) => {
        finish = resolve;
        init?.signal?.addEventListener(
          "abort",
          () => reject(init.signal!.reason),
          { once: true },
        );
      }),
  );
  const client = new GithubTransport(
    "invented-sharing",
    new MemoryResponseCache(),
    send,
  );
  const first = new AbortController(),
    second = new AbortController();
  const a = client.read("/shared", first.signal).catch((error) => error);
  const b = client.read("/shared", second.signal);
  await vi.waitFor(() => expect(send).toHaveBeenCalledOnce());
  first.abort();
  finish(Response.json({ value: "second reader" }));
  expect(await b).toEqual({ value: "second reader" });
  expect(await a).toBeInstanceOf(Error);
  expect(send).toHaveBeenCalledOnce();
  client.dispose();
});
it("caches read-only GraphQL per repository and variables, and refuses mutations", async () => {
  const send = vi.fn<typeof fetch>(async () =>
    Response.json({ data: { repository: { name: "repo" } } }),
  );
  const client = new GithubTransport(
    "invented-graphql",
    new MemoryResponseCache(),
    send,
  );
  const query =
    'query Inventory($owner:String!){repository(owner:$owner,name:"repo"){name}}';
  const read = () =>
    client.query(
      "owner/repo",
      query,
      { owner: "owner" },
      new AbortController().signal,
    );
  expect(await read()).toEqual({ data: { repository: { name: "repo" } } });
  await read();
  expect(send).toHaveBeenCalledOnce();
  expect(send.mock.calls[0]![1]).toMatchObject({
    method: "POST",
    cache: "no-store",
    credentials: "omit",
  });
  await expect(
    client.query(
      "owner/repo",
      'mutation Bad{deleteRepository(input:{repositoryId:"x"}){clientMutationId}}',
      {},
      new AbortController().signal,
    ),
  ).rejects.toThrow(/read.only|query/i);
  expect(send).toHaveBeenCalledOnce();
  client.dispose();
});
it("does not persist partial-error GraphQL results and backs off on GraphQL rate limits", async () => {
  const send = vi.fn<typeof fetch>().mockImplementation(async () =>
    Response.json({
      data: { repository: null },
      errors: [{ type: "FORBIDDEN" }],
    }),
  );
  const client = new GithubTransport(
    "invented-errors",
    new MemoryResponseCache(),
    send,
    () => 1000,
  );
  const read = () =>
    client.query(
      "owner/repo",
      "query Inventory{viewer{login}}",
      {},
      new AbortController().signal,
    );
  await read();
  await read();
  expect(send).toHaveBeenCalledTimes(2);
  send.mockImplementation(async () =>
    Response.json({
      errors: [{ type: "RATE_LIMITED", message: "API rate limit exceeded" }],
    }),
  );
  await expect(read()).rejects.toMatchObject({ retryAt: 61_000 });
  await expect(
    client.read("/blocked", new AbortController().signal),
  ).rejects.toMatchObject({ retryAt: 61_000 });
  expect(send).toHaveBeenCalledTimes(3);
  client.dispose();
});
