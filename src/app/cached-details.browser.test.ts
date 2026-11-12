import { expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { flushSync, mount, unmount } from "svelte";
import MaintenanceDetails from "../components/maintenance/MaintenanceDetails.svelte";
import { MaintenanceController } from "../maintenance/controller.svelte";
import { snapshotFixture, detailFixture } from "../../catalog/fixtures";
import { IndexedDbResponseCache } from "../cache/indexeddb-cache";
import { saveCachedView } from "../cache/view-cache";
import { saveCachedDetail } from "../cache/detail-cache";
import { GithubReadPort } from "../github/read-port";
import { GithubTransport } from "../github/transport";
import "@lapismd/design-core/styles.css";
import "@lapismd/repository-ui/styles.css";
import "../styles/global.css";

it("shows the cached card immediately, then persistent full details before a blocked GitHub refresh", async () => {
  const cache = await IndexedDbResponseCache.open(
    `detail-preview-${crypto.randomUUID()}`,
  );
  const selection = { additions: [], exclusions: [] };
  const snapshot = snapshotFixture();
  snapshot.items = [snapshot.items.find((item) => item.id === "dependency")!];
  snapshot.items[0]!.id = "pr:lapismd/design-core:19";
  snapshot.fetchedAt = new Date().toISOString();
  const detail = detailFixture(snapshot.items[0]!);
  detail.description = "Persisted full pull request description";
  await saveCachedView(cache, selection, snapshot);
  await saveCachedDetail(cache, selection, detail, Date.now() - 600_001);
  let releaseCache!: () => void, releaseNetwork!: () => void;
  const cacheGate = new Promise<void>((resolve) => {
    releaseCache = resolve;
  });
  const networkGate = new Promise<void>((resolve) => {
    releaseNetwork = resolve;
  });
  const get = cache.get.bind(cache);
  vi.spyOn(cache, "get").mockImplementation(async (key) => {
    if (key.startsWith("maintenance-detail:")) await cacheGate;
    return get(key);
  });
  const send = vi.fn<typeof fetch>(async () => {
    await networkGate;
    return Response.json({}, { status: 503 });
  });
  const client = new GithubTransport("invented-token", cache, send);
  const reader = new GithubReadPort(
    client,
    () => selection,
    Date.now,
    undefined,
    cache,
  );
  const controller = new MaintenanceController(reader, {
    execute: async () => {
      throw new Error("Read-only test");
    },
  });
  await controller.refresh();
  const target = document.createElement("div");
  document.body.appendChild(target);
  const app = mount(MaintenanceDetails, {
    target,
    props: { controller, onClose() {} },
  });
  let reading: Promise<void> | undefined;
  try {
    flushSync(() => {
      reading = controller.select(detail.item.id);
    });
    expect(
      target.querySelector(".maintenance-detail-heading h2")?.textContent,
    ).toBe(detail.item.title);
    expect(target.querySelector(".maintenance-detail-skeleton")).toBeNull();
    expect(send).not.toHaveBeenCalled();
    releaseCache();
    await expect
      .element(page.getByText(detail.description, { exact: true }))
      .toBeVisible();
    await vi.waitFor(() => expect(send).toHaveBeenCalled());
    expect(controller.detailLoading).toBe(true);
    expect(controller.detail?.checks).toEqual(detail.checks);
    await expect
      .element(
        page.getByRole("button", { name: "Squash and merge", exact: true }),
      )
      .toBeDisabled();
    releaseNetwork();
    await reading;
    await expect
      .element(page.getByText(detail.description, { exact: true }))
      .toBeVisible();
    expect(controller.detailError).toContain("503");
  } finally {
    releaseCache();
    releaseNetwork();
    controller.dispose();
    client.dispose();
    await reading;
    await unmount(app);
    target.remove();
    await cache.clear();
    await cache.close();
  }
});
