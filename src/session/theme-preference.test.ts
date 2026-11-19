import { describe, expect, it, vi } from "vitest";
import {
  BrowserThemePreferenceStore,
  parseThemePreference,
  readThemePreference,
  themePreferenceKey,
  writeThemePreference,
} from "./theme-preference";

describe("theme preference", () => {
  it("restores only valid persisted values before the system preference", () => {
    expect(readThemePreference({ getItem: () => "light" }, true)).toBe("light");
    expect(readThemePreference({ getItem: () => "dark" }, false)).toBe("dark");
    expect(readThemePreference({ getItem: () => "sepia" }, true)).toBe("dark");
    expect(parseThemePreference(null)).toBeUndefined();
  });

  it("persists an explicit choice and tolerates unavailable storage", () => {
    const setItem = vi.fn();
    expect(writeThemePreference({ setItem }, "dark")).toBe(true);
    expect(setItem).toHaveBeenCalledWith(themePreferenceKey, "dark");
    expect(
      writeThemePreference(
        {
          setItem() {
            throw new DOMException("Storage unavailable");
          },
        },
        "light",
      ),
    ).toBe(false);
    expect(
      readThemePreference(
        {
          getItem() {
            throw new DOMException("Storage unavailable");
          },
        },
        false,
      ),
    ).toBe("light");
  });

  it("keeps the browser storage boundary inside the session store", () => {
    const values = new Map<string, string>();
    const store = new BrowserThemePreferenceStore({
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    });
    expect(store.read(false)).toBe("light");
    expect(store.write("dark")).toBe(true);
    expect(store.read(false)).toBe("dark");
  });
});
