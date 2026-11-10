import { expect, it, vi } from "vitest";
import { MaintenanceSession } from "./session.svelte";
import { MemoryResponseCache } from "../cache/response-cache";
import type { DeviceStore } from "./device-store";
const user = {
  id: 9,
  login: "maintainer",
  name: "Test Maintainer",
  avatar_url: "https://avatars.githubusercontent.com/u/9",
  html_url: "https://github.com/maintainer",
};
function fixture(saved: string | null = null) {
  let token = saved;
  const store: DeviceStore = {
    token: () => token,
    remember: (value) => {
      token = value;
    },
    forget: () => {
      token = null;
    },
    selection: () => ({ additions: [], exclusions: [] }),
    saveSelection: () => {},
  };
  const caches: MemoryResponseCache[] = [];
  const partitions: string[] = [];
  const openCache = vi.fn(async (partition: string) => {
    partitions.push(partition);
    const cache = new MemoryResponseCache();
    vi.spyOn(cache, "close");
    vi.spyOn(cache, "clear");
    caches.push(cache);
    return { cache };
  });
  const send = vi.fn<typeof fetch>(async (input) => {
    const path = new URL(String(input)).pathname;
    return Response.json(
      path === "/user"
        ? user
        : path.endsWith("/repositories.json")
          ? { repositories: [] }
          : path.endsWith("/pulls")
            ? []
            : path.endsWith("/actions/runs")
              ? { workflow_runs: [] }
              : {
                  full_name: "lapismd/dependency-automation",
                  default_branch: "main",
                },
    );
  });
  const session = new MaintenanceSession({ store, openCache, send });
  return { session, store, openCache, caches, partitions, send };
}
it("shows login without a remembered token and performs no provider reads", async () => {
  const { session, send } = fixture();
  await session.restore();
  expect(session.phase).toBe("login");
  expect(session.controller).toBeNull();
  expect(send).not.toHaveBeenCalled();
  await session.dispose();
});
it("restores identity/avatar, keeps credentials outside snapshots and clears the active session on disconnect", async () => {
  const { session, store, caches, partitions, send } =
    fixture("invented-token-one");
  await session.restore();
  expect(session.phase).toBe("connected");
  expect(session.profile?.avatarUrl).toBe(user.avatar_url);
  expect(session.profile?.details.display_name).toBe(user.name);
  expect(partitions[0]).toMatch(/^[0-9a-f]{64}$/);
  expect(JSON.stringify(session.controller?.snapshot)).not.toContain(
    "invented-token-one",
  );
  expect(send.mock.calls.every((call) => call[1]?.method === "GET")).toBe(true);
  const previous = session.controller!;
  await session.disconnect();
  expect(previous.snapshot).toBeNull();
  expect(previous.detail).toBeNull();
  expect(previous.connected).toBe(false);
  expect(store.token()).toBeNull();
  expect(session.controller).toBeNull();
  expect(session.profile).toBeNull();
  expect(caches[0]!.clear).toHaveBeenCalledOnce();
  expect(caches[0]!.close).toHaveBeenCalledOnce();
  await session.dispose();
});
it("reconnecting replaces and disposes the old controller and cache with a separate token partition", async () => {
  const { session, caches, partitions, store } = fixture();
  await session.connect("invented-token-one", true);
  const previous = session.controller!;
  await session.connect("invented-token-two", false);
  expect(caches[0]!.close).toHaveBeenCalledOnce();
  expect(session.controller).not.toBe(previous);
  const reads = previous.snapshot;
  await previous.refresh();
  expect(previous.snapshot).toBe(reads);
  expect(new Set(partitions).size).toBe(2);
  expect(store.token()).toBeNull();
  await session.dispose();
});
it("revoked remembered credentials return to login and are removed", async () => {
  const { session, send, store, openCache } = fixture("invented-revoked-token");
  send.mockResolvedValue(Response.json({}, { status: 401 }));
  await session.restore();
  expect(session.phase).toBe("login");
  expect(store.token()).toBeNull();
  expect(openCache).not.toHaveBeenCalled();
  expect(session.error).toContain("rejected");
  await session.dispose();
});
it("late cache construction after disconnect cannot restore identity or retain an open database", async () => {
  const { session, openCache, store } = fixture();
  const cache = new MemoryResponseCache();
  const close = vi.spyOn(cache, "close");
  let release!: (value: { cache: MemoryResponseCache }) => void;
  openCache.mockImplementation(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  const connecting = session.connect("invented-token", true);
  await vi.waitFor(() => expect(openCache).toHaveBeenCalledOnce());
  await session.disconnect();
  release({ cache });
  await connecting;
  expect(session.phase).toBe("login");
  expect(session.profile).toBeNull();
  expect(store.token()).toBeNull();
  expect(close).toHaveBeenCalledOnce();
  await session.dispose();
});
