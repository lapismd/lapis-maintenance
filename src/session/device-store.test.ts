import { expect, it } from "vitest";
import { BrowserDeviceStore, credentialKey } from "./device-store";
function storage(): Storage {
  const entries = new Map<string, string>();
  return {
    get length() {
      return entries.size;
    },
    clear: () => entries.clear(),
    key: (index) => [...entries.keys()][index] ?? null,
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => {
      entries.set(key, value);
    },
    removeItem: (key) => {
      entries.delete(key);
    },
  };
}
it("keeps remembered credentials separate from repository preferences and forgets unknown records", () => {
  const data = storage(),
    store = new BrowserDeviceStore(data);
  store.remember("invented-token");
  store.saveSelection({
    additions: ["owner/repo"],
    exclusions: ["owner/skip"],
  });
  expect(store.token()).toBe("invented-token");
  store.forget();
  expect(store.token()).toBeNull();
  expect(store.selection().additions).toEqual(["owner/repo"]);
  data.setItem(
    credentialKey,
    JSON.stringify({ version: 99, token: "stale-format" }),
  );
  expect(store.token()).toBeNull();
  expect(data.getItem(credentialKey)).toBeNull();
});
it("rejects malformed preferences without making construction depend on browser storage availability", () => {
  const data = storage(),
    store = new BrowserDeviceStore(data);
  data.setItem(
    "lapis-maintenance:repositories:v1",
    JSON.stringify({
      additions: ["https://github.com/owner/repo", 42, "owner/valid"],
    }),
  );
  expect(store.selection()).toEqual({
    additions: ["owner/valid"],
    exclusions: [],
  });
  expect(() => new BrowserDeviceStore()).not.toThrow();
});
