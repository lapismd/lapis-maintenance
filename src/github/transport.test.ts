import { expect, it, vi } from "vitest";
import { GithubTransport, GithubError } from "./transport";
import { MemoryResponseCache } from "../cache/response-cache";
const signal = () => new AbortController().signal;
it("reuses fresh data, preserves paginated 304 bodies/links and forces conditional manual refresh", async () => {
  let now = 1000;
  const send = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(
      new Response(JSON.stringify([{ id: 1 }]), {
        headers: {
          etag: '"one"',
          link: '<https://api.github.com/list?page=2>; rel="next"',
        },
      }),
    )
    .mockResolvedValueOnce(
      new Response(JSON.stringify([{ id: 2 }]), { headers: { etag: '"two"' } }),
    )
    .mockResolvedValue(new Response(null, { status: 304 }));
  const client = new GithubTransport(
    "synthetic-test-token",
    new MemoryResponseCache(),
    send,
    () => now,
  );
  expect(await client.pages("/list", signal())).toEqual([{ id: 1 }, { id: 2 }]);
  await client.pages("/list", signal());
  expect(send).toHaveBeenCalledTimes(2);
  now += 300_001;
  expect(await client.pages("/list", signal())).toEqual([{ id: 1 }, { id: 2 }]);
  expect(send.mock.calls[2]![1]?.headers).toMatchObject({
    "If-None-Match": '"one"',
    Authorization: "Bearer synthetic-test-token",
  });
  await client.pages("/list", signal(), { force: true });
  expect(send).toHaveBeenCalledTimes(6);
  expect(send.mock.calls.every((call) => call[1]?.method === "GET")).toBe(true);
});
it("backs off on rate limits and refuses credential-bearing or foreign pagination origins", async () => {
  const send = vi.fn<typeof fetch>().mockResolvedValue(
    new Response("{}", {
      status: 403,
      headers: { "x-ratelimit-remaining": "0", "x-ratelimit-reset": "2000" },
    }),
  );
  const client = new GithubTransport(
    "test",
    new MemoryResponseCache(),
    send,
    () => 1000,
  );
  await expect(client.read("/limited", signal())).rejects.toMatchObject({
    retryAt: 2_000_000,
  });
  await expect(client.read("/next", signal())).rejects.toBeInstanceOf(
    GithubError,
  );
  await expect(
    client.read("https://example.com/leak", signal()),
  ).rejects.toThrow("origin");
  await expect(
    client.read("https://user:secret@api.github.com/leak", signal()),
  ).rejects.toThrow("origin");
  expect(send).toHaveBeenCalledTimes(1);
});
it("deduplicates concurrent reads and bounds active requests", async () => {
  let active = 0,
    maximum = 0;
  const send = vi.fn<typeof fetch>(async () => {
    maximum = Math.max(maximum, ++active);
    await new Promise((resolve) => setTimeout(resolve, 5));
    active--;
    return new Response("[]");
  });
  const client = new GithubTransport("test", new MemoryResponseCache(), send);
  await Promise.all([
    client.read("/same", signal()),
    client.read("/same", signal()),
    ...Array.from({ length: 10 }, (_, index) =>
      client.read(`/list/${index}`, signal()),
    ),
  ]);
  expect(send).toHaveBeenCalledTimes(11);
  expect(maximum).toBeLessThanOrEqual(4);
});
it("does not cache a response that arrives after disposal", async () => {
  let resolve!: (response: Response) => void;
  const cache = new MemoryResponseCache(),
    send = vi.fn<typeof fetch>(() => new Promise((value) => (resolve = value)));
  const client = new GithubTransport("test", cache, send);
  const pending = client.read("/late", signal());
  await vi.waitFor(() => expect(send).toHaveBeenCalled());
  client.dispose();
  resolve(new Response("[]"));
  await expect(pending).rejects.toThrow();
  expect(await cache.get("json:/late")).toBeUndefined();
});
it("handles HTTP-date Retry-After and retains actual validation time for cached observations", async () => {
  const now = Date.parse("2026-11-10T10:00:00Z");
  const send = vi.fn<typeof fetch>().mockResolvedValue(
    Response.json(
      {},
      {
        status: 429,
        headers: { "retry-after": new Date(now + 120_000).toUTCString() },
      },
    ),
  );
  const client = new GithubTransport(
    "test",
    new MemoryResponseCache(),
    send,
    () => now,
  );
  await expect(client.read("/limited", signal())).rejects.toMatchObject({
    retryAt: now + 120_000,
  });
  let clock = now;
  const cached = new GithubTransport(
    "test",
    new MemoryResponseCache(),
    async () => Response.json([]),
    () => clock,
  );
  await cached.read("/observed", signal());
  clock += 1000;
  const observe = vi.fn();
  await cached.read("/observed", signal(), { onObservation: observe });
  expect(observe).toHaveBeenCalledWith(now);
});
it("preserves previously cached responses when a forced read hits the hourly rate limit", async () => {
  const cache = new MemoryResponseCache();
  const send = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json({ value: "retained" }))
    .mockResolvedValueOnce(
      Response.json(
        {},
        {
          status: 403,
          headers: {
            "x-ratelimit-remaining": "0",
            "x-ratelimit-reset": "9999999999",
          },
        },
      ),
    );
  const client = new GithubTransport("invented", cache, send);
  await client.read("/cached", signal());
  await expect(
    client.read("/cached", signal(), { force: true }),
  ).rejects.toMatchObject({ status: 403 });
  expect((await cache.get("json:/cached"))?.body).toEqual({
    value: "retained",
  });
  expect(send).toHaveBeenCalledTimes(2);
});
