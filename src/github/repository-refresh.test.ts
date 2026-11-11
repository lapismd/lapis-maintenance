import { expect, it, vi } from "vitest";
import { GithubReadPort } from "./read-port";
import { GithubTransport } from "./transport";
import { MemoryResponseCache } from "../cache/response-cache";
import { readRepository } from "./repository-reads";
import { readCachedView } from "../cache/view-cache";
import { detailFixture, snapshotFixture } from "../../catalog/fixtures";

vi.mock("./repository-reads", () => ({ readRepository: vi.fn() }));
vi.mock("./repository-discovery", () => ({
  discoverRepositories: vi.fn(async () => ({
    repositories: new Map(
      ["owner/a", "owner/b"].map((repository) => [repository, { repository }]),
    ),
    coverage: [],
    defaults: [],
  })),
}));
it("scoped refresh invalidates only its repository and survives an older global scan", async () => {
  const cache = new MemoryResponseCache();
  const selection = { additions: [], exclusions: [] };
  const client = new GithubTransport("invented", cache, vi.fn());
  const reader = new GithubReadPort(
    client,
    () => selection,
    Date.now,
    undefined,
    cache,
  );
  const result = (repository: string, title: string) => {
    const item = {
      ...snapshotFixture().items[0]!,
      id: `pr:${repository}:1`,
      repository,
      title,
    };
    return {
      details: [detailFixture(item)],
      coverage: {
        repository,
        available: true,
        reason: undefined,
        holdReason: undefined,
      },
    };
  };
  const a = result("owner/a", "Before command"),
    b = result("owner/b", "Unaffected");
  const updated = result("owner/a", "After command");
  vi.mocked(readRepository).mockImplementation(async (_client, entry) =>
    entry.repository === "owner/a" ? a : b,
  );
  const signal = new AbortController().signal;
  const initial = await reader.readSnapshot(signal);
  const oldKey = "maintenance-detail:v2:owner/a:old";
  const otherKey = "maintenance-detail:v2:owner/b:other";
  for (const key of [oldKey, otherKey])
    await cache.put(key, { body: {}, fetchedAt: Date.now() });
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let began!: () => void;
  const started = new Promise<void>((resolve) => {
    began = resolve;
  });
  vi.mocked(readRepository).mockImplementation(
    async (_client, entry, _signal, options) => {
      if (entry.repository === "owner/b") return b;
      if (options.priority === "interactive") return updated;
      began();
      await gate;
      return a;
    },
  );
  const progress = vi.fn();
  const full = reader.readSnapshot(signal, {
    force: true,
    onProgress: progress,
  });
  await started;
  const calls = vi.mocked(readRepository).mock.calls.length;
  const scoped = await reader.refreshRepository("owner/a", signal);
  expect(scoped.items[0]?.title).toBe("After command");
  expect(
    vi
      .mocked(readRepository)
      .mock.calls.slice(calls)
      .map((call) => call[1].repository),
  ).toEqual(["owner/a"]);
  expect(await cache.get(oldKey)).toBeUndefined();
  expect(await cache.get(otherKey)).toBeDefined();
  release();
  const final = await full;
  expect(final.items.map((item) => item.title)).toEqual([
    "Unaffected",
    "After command",
  ]);
  expect(progress.mock.calls.at(-1)![0].items).toEqual(final.items);
  const restored = await readCachedView(cache, selection, Date.now());
  expect(restored?.items).toEqual(final.items);
  expect(initial.items[0]?.title).toBe("Before command");
  client.dispose();
});
