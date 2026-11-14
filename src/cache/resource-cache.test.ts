import { expect, it, vi } from "vitest";
import { ResourceCache } from "./resource-cache";
import { MemoryResponseCache } from "./response-cache";
import { GithubError } from "../github/transport";
it("reopens fresh resources without provider requests and retains stale content during failed refresh", async () => {
  let now = 1000;
  const storage = new MemoryResponseCache(),
    resources = new ResourceCache(storage, () => now);
  const load = vi.fn(async () => ({ title: "Cached" }));
  const read = (force = false, onProgress?: (v: { title: string }) => void) =>
    resources.read(
      "resource:repo:pr",
      () => 0,
      load,
      new AbortController().signal,
      { force, onProgress },
    );
  await read();
  await read();
  expect(load).toHaveBeenCalledOnce();
  expect(resources.preview("resource:repo:pr", 0)).toEqual({ title: "Cached" });
  now += 300001;
  const progress = vi.fn();
  load.mockRejectedValueOnce(Error("Disconnected"));
  await expect(read(false, progress)).rejects.toThrow("Disconnected");
  expect(progress).toHaveBeenCalledWith({ title: "Cached" });
  expect(resources.preview("resource:repo:pr", 0)).toEqual({ title: "Cached" });
  resources.dispose();
  await resources.drain();
});
it("rejects late old-epoch results without overwriting a newer resource", async () => {
  const storage = new MemoryResponseCache(),
    resources = new ResourceCache(storage);
  let epoch = 0;
  let resolve!: (value: string) => void;
  const old = resources
    .read(
      "same",
      () => epoch,
      () =>
        new Promise<string>((done) => {
          resolve = done;
        }),
      new AbortController().signal,
    )
    .catch((error) => error);
  await vi.waitFor(() => expect(resolve).toBeDefined());
  epoch++;
  await resources.read(
    "same",
    () => epoch,
    async () => "new",
    new AbortController().signal,
  );
  resolve("old");
  expect(await old).toBeInstanceOf(Error);
  expect((await storage.get("same"))?.body).toBe("new");
  resources.dispose();
});
it("clears denied resource previews and rejects results after disposal", async () => {
  const storage = new MemoryResponseCache(),
    resources = new ResourceCache(storage),
    signal = new AbortController().signal;
  await resources.read(
    "same",
    () => 0,
    async () => "private",
    signal,
  );
  await expect(
    resources.read(
      "same",
      () => 0,
      async () => {
        throw new GithubError(403, "Denied");
      },
      signal,
      { force: true },
    ),
  ).rejects.toThrow("Denied");
  expect(resources.preview("same", 0)).toBeUndefined();
  expect(await storage.get("same")).toBeUndefined();
  resources.dispose();
  await expect(
    resources.read(
      "later",
      () => 0,
      async () => "late",
      signal,
    ),
  ).rejects.toThrow();
});
it("returns verified resources before slow persistence and drains writes before closing", async () => {
  const storage = new MemoryResponseCache();
  let release!: () => void;
  const gate = new Promise<void>((done) => (release = done)),
    put = storage.put.bind(storage);
  vi.spyOn(storage, "put").mockImplementation(async (key, value) => {
    await gate;
    await put(key, value);
  });
  const resources = new ResourceCache(storage),
    signal = new AbortController().signal;
  expect(
    await resources.read(
      "slow",
      () => 0,
      async () => "verified",
      signal,
    ),
  ).toBe("verified");
  expect(resources.preview("slow", 0)).toBe("verified");
  let drained = false;
  const draining = resources.drain().then(() => (drained = true));
  await Promise.resolve();
  expect(drained).toBe(false);
  release();
  await draining;
  expect((await storage.get("slow"))?.body).toBe("verified");
  resources.dispose();
});
it("cannot revive the previous persistent epoch during overlapping refresh reads", async () => {
  const storage = new MemoryResponseCache(),
    resources = new ResourceCache(storage),
    signal = new AbortController().signal;
  let epoch = 0;
  await resources.read(
    "same",
    () => epoch,
    async () => "old",
    signal,
  );
  await resources.drain();
  epoch++;
  let release!: (value: string) => void;
  const gate = new Promise<string>((done) => (release = done)),
    load = vi.fn(() => gate),
    progress = vi.fn();
  const first = resources.read("same", () => epoch, load, signal, {
    onProgress: progress,
  });
  const second = resources.read("same", () => epoch, load, signal, {
    onProgress: progress,
  });
  await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(2));
  expect(progress).not.toHaveBeenCalled();
  release("new");
  expect(await first).toBe("new");
  expect(await second).toBe("new");
  await resources.drain();
  resources.dispose();
});
