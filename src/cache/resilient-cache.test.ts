import { expect, it, vi } from "vitest";
import { MemoryResponseCache } from "./response-cache";
import { ResilientResponseCache } from "./resilient-cache";
it("retains fresh observations when disk quota fails and reports degraded persistence once", async () => {
  const disk = new MemoryResponseCache();
  vi.spyOn(disk, "put").mockRejectedValue(new Error("Quota exceeded"));
  const fallback = vi.fn();
  const cache = new ResilientResponseCache(disk, fallback);
  const value = { body: [{ id: 7 }], fetchedAt: 1000 };
  await cache.put("PR", value);
  expect(await cache.get("PR")).toEqual(value);
  await cache.put("other", value);
  expect(fallback).toHaveBeenCalledOnce();
  expect(cache.kind).toBe("memory");
  await cache.clear();
  expect(await cache.get("PR")).toBeUndefined();
  await cache.close();
});
it("does not hide failure to remove persisted data on explicit disconnect", async () => {
  const disk = new MemoryResponseCache();
  vi.spyOn(disk, "get").mockRejectedValue(new Error("Unavailable"));
  vi.spyOn(disk, "clear").mockRejectedValue(new Error("Cannot clear disk"));
  const cache = new ResilientResponseCache(disk, () => {});
  expect(await cache.get("PR")).toBeUndefined();
  await expect(cache.clear()).rejects.toThrow("Cannot clear disk");
  await cache.close();
});
