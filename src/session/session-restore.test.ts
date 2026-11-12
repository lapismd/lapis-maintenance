import { expect, it, vi } from "vitest";
import { MaintenanceSession } from "./session.svelte";
import { MemoryResponseCache } from "../cache/response-cache";
import { saveCachedView, viewKey } from "../cache/view-cache";
import { snapshotFixture } from "../../catalog/fixtures";
import type { DeviceStore } from "./device-store";

const user = {
  id: 9,
  login: "maintainer",
  name: "Maintainer",
  avatar_url: "",
  html_url: "https://github.com/maintainer",
};
async function fixture() {
  const selection = { additions: [], exclusions: [] };
  const cache = new MemoryResponseCache();
  const clear = vi.spyOn(cache, "clear");
  const snapshot = snapshotFixture();
  snapshot.fetchedAt = new Date().toISOString();
  await saveCachedView(cache, selection, snapshot);
  let token: string | null = "invented-remembered-token";
  const store: DeviceStore = {
    token: () => token,
    identity: () => user,
    remember: (value) => {
      token = value;
    },
    forget: () => {
      token = null;
    },
    selection: () => selection,
    saveSelection: () => {},
  };
  let release!: (response: Response) => void;
  const auth = new Promise<Response>((resolve) => {
    release = resolve;
  });
  const send = vi.fn<typeof fetch>(async (input) => {
    const path = new URL(String(input)).pathname;
    if (path === "/user") return auth;
    return Response.json(
      path.endsWith("/repositories.json")
        ? { repositories: [] }
        : {
            default_branch: "main",
            full_name: "lapismd/dependency-automation",
          },
    );
  });
  const session = new MaintenanceSession({
    store,
    send,
    openCache: async () => ({ cache }),
  });
  const restoring = session.restore();
  await vi.waitFor(() =>
    expect(session.controller?.snapshot?.items.length).toBe(
      snapshot.items.length,
    ),
  );
  return {
    session,
    restoring,
    release,
    store,
    snapshot,
    cache,
    clear,
    send,
    selection,
  };
}
it("renders cached cards before authentication, denies fresh command validation, and clears revoked previews", async () => {
  const f = await fixture();
  try {
    expect(f.session.phase).toBe("connecting");
    expect(f.session.notice).toContain("read-only");
    expect(
      f.session
        .controller!.snapshot!.items.flatMap((item) => item.actions)
        .every((action) => !action.available),
    ).toBe(true);
    const actionable = f.snapshot.items.find((item) =>
      item.actions.some((action) => action.available),
    )!;
    const action = actionable.actions.find((action) => action.available)!;
    f.session.controller!.commands.prepare(actionable, action.kind);
    await f.session.controller!.commands.confirm();
    expect(f.session.controller!.commands.receipts.at(-1)?.status).toBe(
      "rejected",
    );
    expect(f.send).toHaveBeenCalledOnce();
    f.release(Response.json({}, { status: 401 }));
    await f.restoring;
    expect(f.session.phase).toBe("login");
    expect(f.session.controller).toBeNull();
    expect(f.session.profile).toBeNull();
    expect(f.store.token()).toBeNull();
    expect(f.clear).toHaveBeenCalledOnce();
    expect(await f.cache.get(viewKey(f.selection))).toBeUndefined();
  } finally {
    f.release(Response.json(user));
    await f.restoring;
    await f.session.dispose();
  }
});
it("keeps the reviewed controller and filters when authentication enables live ports", async () => {
  const f = await fixture();
  const controller = f.session.controller!;
  controller.query = "registry";
  try {
    f.release(Response.json(user));
    await f.restoring;
    expect(f.session.phase).toBe("connected");
    expect(f.session.controller).toBe(controller);
    expect(controller.query).toBe("registry");
    expect(
      controller
        .snapshot!.items.flatMap((item) => item.actions)
        .some((action) => action.available),
    ).toBe(true);
    expect(f.send.mock.calls.every((call) => call[1]?.method === "GET")).toBe(
      true,
    );
  } finally {
    f.release(Response.json(user));
    await f.restoring;
    await f.session.dispose();
  }
});
it("does not reattach a cached or live session after disconnect during authentication", async () => {
  const f = await fixture();
  const controller = f.session.controller!;
  await f.session.disconnect();
  f.release(Response.json(user));
  await f.restoring;
  expect(f.session.phase).toBe("login");
  expect(f.session.controller).toBeNull();
  expect(controller.snapshot).toBeNull();
  expect(f.store.token()).toBeNull();
  expect(f.send).toHaveBeenCalledOnce();
  await f.session.dispose();
});
