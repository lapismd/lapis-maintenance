import { validRepository, type RepositorySelection } from "../github/models";
import type { GithubUser } from "../github/models";
import { savedIdentity } from "./session-identity";
export const credentialKey = "lapis-maintenance:session:v1";
const selectionKey = "lapis-maintenance:repositories:v1";
export function sameRememberedToken(
  previous: string | null,
  next: string | null,
): boolean {
  const token = (raw: string | null) => {
    try {
      const value = JSON.parse(raw ?? "null");
      return value?.version === 1 && typeof value.token === "string"
        ? value.token
        : null;
    } catch {
      return null;
    }
  };
  const before = token(previous);
  return !!before && before === token(next);
}
export interface DeviceStore {
  token(): string | null;
  remember(token: string, identity?: GithubUser): void;
  identity?(): GithubUser | null;
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
  identity(): GithubUser | null {
    if (!this.token()) return null;
    try {
      return savedIdentity(
        JSON.parse(this.#storage().getItem(credentialKey)!).identity,
      );
    } catch {
      return null;
    }
  }
  remember(token: string, identity?: GithubUser) {
    this.#storage().setItem(
      credentialKey,
      JSON.stringify({
        version: 1,
        token,
        identity: savedIdentity(identity) ?? undefined,
      }),
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
