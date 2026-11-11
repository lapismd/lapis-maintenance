import { expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { mount, unmount } from "svelte";
import App from "./App.svelte";
import { credentialKey } from "../session/device-store";
import { IndexedDbResponseCache } from "../cache/indexeddb-cache";
import { viewKey } from "../cache/view-cache";
import type { MaintenanceSnapshot } from "../maintenance/types";
import "@lapismd/design-core/styles.css";
import "@lapismd/repository-ui/styles.css";
import "../styles/global.css";

it("restores real persistent fallback cards before blocked background discovery and clears their spinners on completion", async () => {
  const token = `invented-reload-${crypto.randomUUID()}`;
  const id = 987654322,
    sha = "a".repeat(40);
  const descriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "crossOriginIsolated",
  );
  Object.defineProperty(globalThis, "crossOriginIsolated", {
    value: false,
    configurable: true,
  });
  localStorage.removeItem(credentialKey);
  const nativeFetch = globalThis.fetch.bind(globalThis);
  let block = false,
    release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const send = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async (input, init) => {
      const url = new URL(String(input), location.href),
        path = url.pathname;
      if (url.origin !== "https://api.github.com")
        return nativeFetch(input, init);
      if (path === "/user")
        return Response.json({
          id,
          login: "test-maintainer",
          avatar_url: "",
          name: "Reload maintainer",
        });
      if (path.endsWith("/repositories.json")) {
        if (block) await gate;
        return Response.json({ repositories: [] });
      }
      if (path.endsWith("/pulls"))
        return Response.json([
          {
            state: "open",
            number: 1,
            title: "Cached reload PR",
            html_url: "https://github.com/lapismd/dependency-automation/pull/1",
            updated_at: new Date().toISOString(),
            draft: false,
            head: { sha, ref: "feature" },
            base: { ref: "main" },
            labels: [],
            requested_reviewers: [],
          },
        ]);
      if (path.endsWith("/check-runs"))
        return Response.json({ check_runs: [] });
      if (path.endsWith("/statuses") || path.endsWith("/reviews"))
        return Response.json([]);
      if (path.endsWith("/actions/runs"))
        return Response.json({ workflow_runs: [] });
      if (path.includes("/commits/")) return Response.json({ sha });
      return Response.json({
        default_branch: "main",
        full_name: "lapismd/dependency-automation",
      });
    });
  const target = document.createElement("div");
  document.body.appendChild(target);
  let app = mount(App, { target });
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`lapis-maintenance:v1:${id}:${token}`),
  );
  const partition = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  try {
    await page.getByLabelText("GitHub token").fill(token);
    await page.getByRole("button", { name: "Connect GitHub" }).click();
    const card = () =>
      page.getByRole("button", { name: /Open card: Cached reload PR/ });
    await expect.element(card()).toBeVisible();
    await expect
      .element(page.getByRole("button", { name: "Refresh", exact: true }))
      .toBeEnabled();
    await unmount(app);
    target.replaceChildren();
    const cache = await IndexedDbResponseCache.open(partition);
    const key = viewKey({ additions: [], exclusions: [] });
    const record = (await cache.get(key))!;
    const snapshot = (record.body as { snapshot: MaintenanceSnapshot })
      .snapshot;
    snapshot.fetchedAt = new Date(Date.now() - 600_001).toISOString();
    await cache.put(key, { ...record, body: { schema: 1, snapshot } });
    await cache.removePrefix("json:");
    await cache.removePrefix("application/vnd.github.raw+json:");
    await cache.close();
    expect(JSON.parse(localStorage.getItem(credentialKey)!).token).toBe(token);
    block = true;
    app = mount(App, { target });
    await vi.waitFor(
      () => expect(target.querySelector(".maintenance-board")).not.toBeNull(),
      { timeout: 3000 },
    );
    await expect.element(card()).toBeVisible();
    await expect
      .element(page.getByRole("img", { name: "Refreshing Cached reload PR" }))
      .toBeVisible();
    expect(target.querySelector(".maintenance-loading")).toBeNull();
    release();
    await expect
      .element(page.getByRole("button", { name: "Refresh", exact: true }))
      .toBeEnabled();
    expect(target.querySelector(".maintenance-card-spinner")).toBeNull();
  } finally {
    release();
    await unmount(app);
    target.remove();
    send.mockRestore();
    localStorage.removeItem(credentialKey);
    if (descriptor)
      Object.defineProperty(globalThis, "crossOriginIsolated", descriptor);
    else Reflect.deleteProperty(globalThis, "crossOriginIsolated");
    const cache = await IndexedDbResponseCache.open(partition);
    await cache.clear();
    await cache.close();
  }
}, 30_000);
