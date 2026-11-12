import { expect, it, vi } from "vitest";
import { snapshotFixture, detailFixture } from "../../catalog/fixtures";
import { MemoryResponseCache } from "../cache/response-cache";
import { saveCachedDetail } from "../cache/detail-cache";
import { saveCachedView } from "../cache/view-cache";
import { GithubReadPort } from "./read-port";
import { GithubTransport } from "./transport";

async function fixture() {
  let time = Date.now();
  const selection = { additions: [], exclusions: [] as string[] };
  const cache = new MemoryResponseCache();
  const snapshot = snapshotFixture();
  snapshot.items = [snapshot.items.find((item) => item.id === "dependency")!];
  snapshot.items[0]!.id = "pr:lapismd/design-core:19";
  snapshot.fetchedAt = new Date(time).toISOString();
  const detail = detailFixture(structuredClone(snapshot.items[0]!));
  const send = vi.fn<typeof fetch>(async () =>
    Response.json({}, { status: 503 }),
  );
  const client = new GithubTransport("invented-token", cache, send, () => time);
  const reader = new GithubReadPort(
    client,
    () => selection,
    () => time,
    undefined,
    cache,
  );
  const signal = new AbortController().signal;
  await saveCachedView(cache, selection, snapshot);
  await saveCachedDetail(cache, selection, detail, time);
  await reader.readSnapshot(signal);
  await reader.readDetails(detail.item.id, signal);
  return {
    reader,
    client,
    cache,
    selection,
    snapshot,
    detail,
    send,
    signal,
    advance: (duration: number) => {
      time += duration;
    },
  };
}

it("publishes retained full details synchronously after a snapshot restore while local storage is pending", async () => {
  const { reader, cache, detail, signal, client } = await fixture();
  await reader.readSnapshot(signal);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const get = cache.get.bind(cache);
  vi.spyOn(cache, "get").mockImplementation(async (key) => {
    if (key.startsWith("maintenance-detail:")) await gate;
    return get(key);
  });
  const progress = vi.fn();
  const reading = reader.readDetails(detail.item.id, signal, {
    onProgress: progress,
  });
  try {
    expect(progress).toHaveBeenCalledWith(detail);
  } finally {
    release();
    await reading;
    client.dispose();
  }
});

it.each(["validation", "revision", "selection", "expiry"])(
  "does not reuse a retained detail for %s changes",
  async (change) => {
    const {
      reader,
      client,
      cache,
      detail,
      selection,
      snapshot,
      signal,
      advance,
    } = await fixture();
    if (change === "revision") snapshot.items[0]!.target.sha = "new-revision";
    if (change === "selection") selection.exclusions.push("lapismd/other");
    if (change === "expiry") advance(86_400_000);
    await saveCachedView(cache, selection, {
      ...snapshot,
      fetchedAt: new Date().toISOString(),
    });
    if (change !== "expiry") await reader.readSnapshot(signal);
    const progress = vi.fn();
    try {
      await expect(
        reader.readDetails(detail.item.id, signal, {
          fresh: change === "validation",
          onProgress: progress,
        }),
      ).rejects.toThrow();
      expect(progress).not.toHaveBeenCalled();
    } finally {
      client.dispose();
    }
  },
);
