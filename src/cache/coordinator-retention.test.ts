import { expect, it } from "vitest";
import { MemoryResponseCache } from "./response-cache";
import { RetainedResponseCache } from "./retained-cache";
import { operatorFixture } from "../../catalog/operations/fixtures";

function evidence() {
  const result = operatorFixture().coordinator!;
  result.sourceRevision = "d".repeat(40);
  const operation = result.report!.operations[0]!;
  result.report!.operations = [
    {
      ...operation,
      id: "1".repeat(64),
      observedAt: "2026-11-15T18:00:00Z",
      reason: "Obsolete decision",
    },
    {
      ...operation,
      id: "2".repeat(64),
      observedAt: "2026-11-15T19:00:00Z",
      reason: "Previous decision",
    },
    {
      ...operation,
      id: "3".repeat(64),
      observedAt: "2026-11-15T20:00:00Z",
      reason: "Current decision",
    },
  ];
  return result;
}

it("persists only the current and one previous decision per repository without mutating source evidence", async () => {
  const disk = new MemoryResponseCache(),
    cache = new RetainedResponseCache(disk);
  const source = evidence();
  try {
    await cache.put("coordinator-evidence:v2", {
      body: source,
      fetchedAt: Date.now(),
    });
    const stored = (await disk.get("coordinator-evidence:v2"))
      ?.body as typeof source;
    expect(stored.report!.operations.map((o) => o.reason)).toEqual([
      "Previous decision",
      "Current decision",
    ]);
    const snapshot = { ...operatorFixture(), coordinator: source };
    await cache.put("maintenance-view:legacy", {
      body: { schema: 1, snapshot },
      fetchedAt: Date.now(),
    });
    const legacy = (await disk.get("maintenance-view:legacy"))?.body as {
      snapshot: typeof snapshot;
    };
    expect(legacy.snapshot.coordinator.report!.operations).toHaveLength(2);
    expect(source.report!.operations).toHaveLength(3);
    expect(stored.sourceRevision).toBe(source.sourceRevision);
    expect(stored.operationHistory).toBe("latest-and-previous");
    expect(stored.report!.reportId).toBe(source.report!.reportId);
  } finally {
    await cache.close();
  }
});

it("reopens a compact derived coordinator resource without additional GitHub requests", async () => {
  const { vi } = await import("vitest");
  const { GithubTransport } = await import("../github/transport");
  const { GithubReadPort } = await import("../github/read-port");
  const disk = new MemoryResponseCache(),
    cache = new RetainedResponseCache(disk);
  const source = evidence(),
    now = () => Date.parse(source.report!.observedAt);
  const send = vi.fn<typeof fetch>(async (input) => {
    const path = new URL(String(input)).pathname;
    return Response.json(
      path.includes("git/ref/")
        ? { object: { sha: source.sourceRevision } }
        : path.endsWith("/commits/main")
          ? { sha: source.report!.policyRevision }
          : source.report,
    );
  });
  const client = new GithubTransport("invented", cache, send, now);
  const reader = () =>
    new GithubReadPort(
      client,
      () => ({ additions: [], exclusions: [] }),
      now,
      undefined,
      cache,
    );
  const first = reader(),
    second = reader();
  try {
    const loaded = await first.readCoordinatorReport(
      new AbortController().signal,
    );
    await first.drain();
    await client.drain();
    expect(loaded.report!.operations).toHaveLength(2);
    expect(send).toHaveBeenCalledTimes(3);
    expect(
      await second.readCoordinatorReport(new AbortController().signal),
    ).toEqual(loaded);
    expect(send).toHaveBeenCalledTimes(3);
    expect(
      (await disk.get(
        `application/vnd.github.raw+json:/repos/lapismd/dependency-automation/contents/report.json?ref=${source.sourceRevision}`,
      )) === undefined,
    ).toBe(true);
  } finally {
    client.dispose();
    await client.drain();
    await first.drain();
    await second.drain();
    await cache.close();
  }
});

it("removes legacy full-report resources and raw HTTP history without keeping filtered ETag bodies", async () => {
  const disk = new MemoryResponseCache(),
    cache = new RetainedResponseCache(disk);
  const keys = [
    "coordinator-evidence:v1",
    "application/vnd.github.raw+json:/repos/lapismd/dependency-automation/contents/report.json?ref=immutable",
  ];
  try {
    for (const key of keys)
      await disk.put(key, {
        body: evidence(),
        etag: '"full-report"',
        fetchedAt: Date.now(),
      });
    await cache.sweep((_key, value) => value);
    for (const key of keys) {
      expect((await disk.get(key)) === undefined).toBe(true);
      await cache.put(key, {
        body: evidence(),
        etag: '"full-report"',
        fetchedAt: Date.now(),
      });
      expect((await disk.get(key)) === undefined).toBe(true);
      expect((await cache.get(key)) === undefined).toBe(true);
    }
  } finally {
    await cache.close();
  }
});
