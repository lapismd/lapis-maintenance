import { validRepository, type RepositorySelection } from "../github/models";
export const credentialKey = "lapis-maintenance:session:v1";
const selectionKey = "lapis-maintenance:repositories:v1";
export interface DeviceStore {
  token(): string | null;
  remember(token: string): void;
  forget(): void;
  selection(): RepositorySelection;
  saveSelection(selection: RepositorySelection): void;
}
export class BrowserDeviceStore implements DeviceStore {
  constructor(private storage?: Storage) {}
  #storage(): Storage {
    return this.storage ?? localStorage;
  }
  token(): string | null {
    const raw = this.#storage().getItem(credentialKey);
    if (!raw) return null;
    try {
      const value: unknown = JSON.parse(raw);
      if (
        value &&
        typeof value === "object" &&
        "version" in value &&
        value.version === 1 &&
        "token" in value &&
        typeof value.token === "string"
      )
        return value.token;
    } catch {
      /* Invalid saved state returns to login. */
    }
    this.forget();
    return null;
  }
  remember(token: string) {
    this.#storage().setItem(
      credentialKey,
      JSON.stringify({ version: 1, token }),
    );
  }
  forget() {
    this.#storage().removeItem(credentialKey);
  }
  selection(): RepositorySelection {
    try {
      const value = JSON.parse(
        this.#storage().getItem(selectionKey) ?? "{}",
      ) as Partial<RepositorySelection>;
      return {
        additions: Array.isArray(value.additions)
          ? value.additions.filter(validRepository)
          : [],
        exclusions: Array.isArray(value.exclusions)
          ? value.exclusions.filter(validRepository)
          : [],
      };
    } catch {
      return { additions: [], exclusions: [] };
    }
  }
  saveSelection(selection: RepositorySelection) {
    this.#storage().setItem(selectionKey, JSON.stringify(selection));
  }
}
