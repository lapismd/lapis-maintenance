import { describe, expect, it } from "vitest";
import { ActivityController } from "./controller.svelte";
import { MemoryActivityPort } from "../../../catalog/activity/memory-port";
import type { ActivityPage, ActivityQuery, ActivityReadPort } from "./types";
const query: ActivityQuery = {
  search: "",
  repositories: [],
  statuses: [],
  kinds: [],
};
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
function controlled() {
  const calls: {
    query: ActivityQuery;
    cursor?: string;
    signal: AbortSignal;
    result: ReturnType<typeof deferred<ActivityPage>>;
  }[] = [];
  const port: ActivityReadPort = {
    readPage(query, cursor, signal) {
      const result = deferred<ActivityPage>();
      calls.push({ query, cursor, signal, result });
      return result.promise;
    },
  };
  return { calls, controller: new ActivityController(port) };
}
const events = new MemoryActivityPort().events;
describe("workspace activity controller", () => {
  it("waits for a query, and reuses normalized equivalent filters and loaded rows", async () => {
    const port = new MemoryActivityPort("populated", 0);
    const controller = new ActivityController(port);
    expect(port.calls).toHaveLength(0);
    await controller.setQuery({
      ...query,
      search: "  PR  ",
      kinds: ["review", "check", "review"],
    });
    const rows = controller.events;
    controller.scrollOffset = 900;
    await controller.setQuery({
      ...query,
      search: "pr",
      kinds: ["check", "review"],
    });
    expect(port.calls).toHaveLength(1);
    expect(controller.events).toBe(rows);
    expect(controller.scrollOffset).toBe(900);
    controller.dispose();
  });
  it("loads only requested pages, suppresses duplicate page clicks and deduplicates IDs", async () => {
    const { controller, calls } = controlled();
    const first = controller.setQuery(query);
    calls[0]!.result.resolve({
      events: events.slice(0, 2),
      nextCursor: "second",
      total: 4,
    });
    await first;
    expect(calls).toHaveLength(1);
    const next = controller.loadMore();
    await controller.loadMore();
    expect(calls).toHaveLength(2);
    expect(calls[1]!.cursor).toBe("second");
    calls[1]!.result.resolve({ events: events.slice(1, 4), total: 4 });
    await next;
    expect(controller.events.map((event) => event.id)).toEqual(
      events.slice(0, 4).map((event) => event.id),
    );
    await controller.loadMore();
    expect(calls).toHaveLength(2);
    controller.dispose();
  });
  it("resets query cursor and scroll, ignoring stale pages from cancellation-ignoring ports", async () => {
    const { controller, calls } = controlled();
    const first = controller.setQuery(query);
    calls[0]!.result.resolve({
      events: events.slice(0, 2),
      nextCursor: "old-page",
      total: 240,
    });
    await first;
    controller.scrollOffset = 1200;
    const old = controller.loadMore();
    const changed = controller.setQuery({ ...query, kinds: ["workflow"] });
    expect(calls[1]!.signal.aborted).toBe(true);
    expect(controller.events).toEqual([]);
    expect(controller.scrollOffset).toBe(0);
    expect(controller.nextCursor).toBeUndefined();
    calls[2]!.result.resolve({ events: [events[3]!], total: 1 });
    await changed;
    calls[1]!.result.resolve({ events, total: 240, nextCursor: "stale" });
    await old;
    expect(controller.events).toEqual([events[3]]);
    expect(controller.nextCursor).toBeUndefined();
    expect(controller.pending).toBe(false);
    controller.dispose();
  });
  it("retains rows during refresh and failure, then retries the first page", async () => {
    const { controller, calls } = controlled();
    const first = controller.setQuery(query);
    calls[0]!.result.resolve({ events: events.slice(0, 2), total: 2 });
    await first;
    const rows = controller.events;
    const refresh = controller.refresh();
    expect(controller.refreshing).toBe(true);
    expect(controller.events).toBe(rows);
    calls[1]!.result.reject(Error("Temporary outage"));
    await refresh;
    expect(controller.error).toBe("Temporary outage");
    expect(controller.events).toBe(rows);
    const retry = controller.retry();
    expect(calls[2]!.cursor).toBeUndefined();
    calls[2]!.result.resolve({ events: [events[5]!], total: 1 });
    await retry;
    expect(controller.error).toBeNull();
    expect(controller.events).toEqual([events[5]]);
    controller.dispose();
  });
  it("retries a failed cursor without losing existing events", async () => {
    const { controller, calls } = controlled();
    const first = controller.setQuery(query);
    calls[0]!.result.resolve({
      events: [events[0]!],
      nextCursor: "retry-me",
      total: 2,
    });
    await first;
    const page = controller.loadMore();
    calls[1]!.result.reject(Error("Page unavailable"));
    await page;
    expect(controller.events).toEqual([events[0]]);
    const retry = controller.retry();
    expect(calls[2]!.cursor).toBe("retry-me");
    calls[2]!.result.resolve({ events: [events[1]!], total: 2 });
    await retry;
    expect(controller.events).toHaveLength(2);
    expect(controller.error).toBeNull();
    controller.dispose();
  });
  it("aborts replaced refreshes and disposal, rejecting all late mutations", async () => {
    const { controller, calls } = controlled();
    const first = controller.setQuery(query);
    const second = controller.refresh();
    expect(calls[0]!.signal.aborted).toBe(true);
    calls[0]!.result.reject(Error("Ignored abort"));
    await first;
    expect(controller.pending).toBe(true);
    expect(controller.error).toBeNull();
    controller.dispose();
    expect(calls[1]!.signal.aborted).toBe(true);
    calls[1]!.result.resolve({ events, total: 240 });
    await second;
    await controller.refresh();
    await controller.setQuery({ ...query, search: "later" });
    await controller.loadMore();
    expect(calls).toHaveLength(2);
    expect(controller.events).toEqual([]);
    expect(controller.pending).toBe(false);
  });
  it("combines fixture filters before cursor pagination", async () => {
    const port = new MemoryActivityPort("populated", 0);
    const controller = new ActivityController(port);
    await controller.setQuery({
      ...query,
      repositories: [events[0]!.repository],
      statuses: [events[0]!.status],
      kinds: ["pull-request", "review"],
    });
    expect(controller.total).toBeGreaterThan(0);
    expect(
      controller.events.every(
        (event) =>
          event.repository === events[0]!.repository &&
          event.status === events[0]!.status &&
          ["pull-request", "review"].includes(event.kind),
      ),
    ).toBe(true);
    controller.dispose();
  });
});
