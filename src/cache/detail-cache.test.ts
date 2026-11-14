import { expect, it } from "vitest";
import { readCachedDetail, saveCachedDetail } from "./detail-cache";
import { MemoryResponseCache } from "./response-cache";
import { viewKey } from "./view-cache";
import type { MaintenanceDetail } from "../maintenance/types";
it("recomputes derived approval policy after upgrades without dropping raw responses", async () => {
  const cache = new MemoryResponseCache();
  const selection = { additions: [], exclusions: [] };
  const target = {
    kind: "workflow" as const,
    sha: "a".repeat(40),
    runId: 12,
    attempt: 2,
  };
  const detail: MaintenanceDetail = {
    item: {
      id: "run:owner/repo:12",
      repository: "owner/repo",
      title: "Update",
      kind: "workflow",
      category: "dependency",
      status: "approval-wait",
      updatedAt: "now",
      target,
      url: "https://github.com/owner/repo/actions/runs/12",
      reasons: [],
      actions: [
        {
          kind: "approve-run",
          label: "Approve workflow run",
          available: false,
        },
      ],
    },
    checks: [],
    description: "",
  };
  const now = Date.now();
  const raw = { body: { conclusion: "action_required" }, fetchedAt: now };
  await cache.put("json:/repos/owner/repo/actions/runs/12", raw);
  await cache.put(
    `maintenance-detail:v2:owner/repo:${viewKey(selection)}:${detail.item.id}`,
    { body: { schema: 1, detail }, fetchedAt: now },
  );
  expect(
    await readCachedDetail(cache, selection, detail.item.id, target, now),
  ).toBeUndefined();
  detail.item.actions[0]!.available = true;
  await saveCachedDetail(cache, selection, detail, now);
  expect(
    (await readCachedDetail(cache, selection, detail.item.id, target, now))
      ?.detail.item.actions[0]?.available,
  ).toBe(true);
  expect(await cache.get("json:/repos/owner/repo/actions/runs/12")).toEqual(
    raw,
  );
});
