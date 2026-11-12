import { expect, it } from "vitest";
import {
  BrowserDeviceStore,
  credentialKey,
  sameRememberedToken,
} from "./device-store";
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
it("remembers only a validated identity for the saved token and migrates token-only records", () => {
  const data = storage(),
    store = new BrowserDeviceStore(data);
  store.remember("invented-legacy-token");
  expect(store.identity()).toBeNull();
  store.remember("invented-token", {
    id: 9,
    login: "maintainer",
    name: "Maintainer",
    avatar_url: "https://avatars.githubusercontent.com/u/9",
    html_url: "https://github.com/maintainer",
  });
  expect(store.identity()?.id).toBe(9);
  store.remember("different-token");
  expect(store.identity()).toBeNull();
  store.forget();
  expect(store.identity()).toBeNull();
});
it("distinguishes token changes from refreshed bootstrap identity metadata across tabs", () => {
  const before = JSON.stringify({ version: 1, token: "invented-token" });
  expect(
    sameRememberedToken(
      before,
      JSON.stringify({
        version: 1,
        token: "invented-token",
        identity: { id: 9 },
      }),
    ),
  ).toBe(true);
  expect(
    sameRememberedToken(
      before,
      JSON.stringify({ version: 1, token: "different-token" }),
    ),
  ).toBe(false);
  expect(sameRememberedToken(before, null)).toBe(false);
  expect(sameRememberedToken(before, "invalid-json")).toBe(false);
});
