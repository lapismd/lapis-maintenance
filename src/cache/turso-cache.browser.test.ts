import { expect, it } from "vitest";
import { TursoResponseCache } from "./turso-cache";
it("persists real Turso WASM records across connections, isolates tokens and clears the active database", async () => {
  expect(crossOriginIsolated).toBe(true);
  const partition = `test-${crypto.randomUUID()}`;
  const first = await TursoResponseCache.open(partition);
  const record = {
    body: [{ title: "Cached PR" }],
    etag: '"revision-1"',
    fetchedAt: 1234,
    next: "https://api.github.com/repos/lapismd/example/pulls?page=2",
  };
  await first.put("pulls", record);
  await first.close();
  const second = await TursoResponseCache.open(partition);
  expect(await second.get("pulls")).toEqual(record);
  const other = await TursoResponseCache.open(`${partition}-other`);
  expect(await other.get("pulls")).toBeUndefined();
  await other.close();
  await Promise.all(
    Array.from({ length: 20 }, (_, index) =>
      second.put(`parallel-${index}`, { ...record, body: { index } }),
    ),
  );
  expect((await second.get("parallel-19"))?.body).toEqual({ index: 19 });
  for (const key of ["repo:a:detail", "repo:a:checks", "repo:ab:detail"])
    await second.put(key, record);
  await second.removePrefix("repo:a:");
  expect(await second.get("repo:a:detail")).toBeUndefined();
  expect(await second.get("repo:a:checks")).toBeUndefined();
  expect(await second.get("repo:ab:detail")).toEqual(record);
  await second.clear();
  expect(await second.get("pulls")).toBeUndefined();
  await second.close();
});
