import { expect, it, vi } from "vitest";
import { GithubReadPort } from "./read-port";
import { GithubTransport } from "./transport";
import { MemoryResponseCache } from "../cache/response-cache";
import { saveCachedView, readCachedView } from "../cache/view-cache";
import { snapshotFixture } from "../../catalog/fixtures";

it("publishes a fresh cached board before slow allowlist discovery finishes", async () => {
  const cache = new MemoryResponseCache();
  const snapshot = snapshotFixture();
  const selection = { additions: [], exclusions: [] };
  const now = Date.parse(snapshot.fetchedAt);
  await saveCachedView(cache, selection, snapshot);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const send = vi.fn<typeof fetch>(async () => {
    await gate;
    return Response.json({ repositories: [] });
  });
  const client = new GithubTransport("invented", cache, send, () => now);
  const reader = new GithubReadPort(
    client,
    () => selection,
    () => now,
    undefined,
    cache,
    () => {},
  );
  const progress = vi.fn();
  const reading = reader.readSnapshot(new AbortController().signal, {
    onProgress: progress,
  });
  try {
    await vi.waitFor(() => expect(send).toHaveBeenCalled());
    expect(progress).toHaveBeenCalledWith(snapshot);
  } finally {
    release();
    await reading;
    client.dispose();
  }
});

it("restores an interrupted partial scan instead of discarding its cached cards", async () => {
  const cache = new MemoryResponseCache();
  const selection = { additions: [], exclusions: [] };
  const snapshot = snapshotFixture();
  snapshot.repositories[0]!.loading = true;
  await saveCachedView(cache, selection, snapshot);
  expect(
    await readCachedView(cache, selection, Date.parse(snapshot.fetchedAt)),
  ).toEqual(snapshot);
});
