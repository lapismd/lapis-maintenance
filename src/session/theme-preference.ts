export const themePreferenceKey = "lapis-maintenance:theme:v1";

export type ThemePreference = "light" | "dark";

export function parseThemePreference(
  value: string | null,
): ThemePreference | undefined {
  return value === "light" || value === "dark" ? value : undefined;
}

export function readThemePreference(
  storage: Pick<Storage, "getItem">,
  prefersDark: boolean,
): ThemePreference {
  try {
    return (
      parseThemePreference(storage.getItem(themePreferenceKey)) ??
      (prefersDark ? "dark" : "light")
    );
  } catch {
    return prefersDark ? "dark" : "light";
  }
}

export function writeThemePreference(
  storage: Pick<Storage, "setItem">,
  value: ThemePreference,
): boolean {
  try {
    storage.setItem(themePreferenceKey, value);
    return true;
  } catch {
    return false;
  }
}

export class BrowserThemePreferenceStore {
  constructor(
    private readonly storage?: Pick<Storage, "getItem" | "setItem">,
  ) {}

  private target() {
    return this.storage ?? localStorage;
  }

  read(prefersDark: boolean): ThemePreference {
    return readThemePreference(this.target(), prefersDark);
  }

  write(value: ThemePreference): boolean {
    return writeThemePreference(this.target(), value);
  }
}
