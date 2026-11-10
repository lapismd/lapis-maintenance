import type { PersonalProfile } from "@lapismd/repository-ui/settings";
import { MaintenanceController } from "../maintenance/controller.svelte";
import { GithubTransport, GithubError } from "../github/transport";
import { GithubReadPort } from "../github/read-port";
import { GithubCommandPort } from "../github/command-port";
import { GithubWriteTransport } from "../github/write-transport";
import type {
  GithubUser,
  RepositorySelection,
  RepositoryDefault,
} from "../github/models";
import {
  MemoryResponseCache,
  type ResponseCache,
} from "../cache/response-cache";
import { openResponseCache } from "../cache/turso-cache";
import type { DeviceStore } from "./device-store";
interface SessionDependencies {
  store: DeviceStore;
  openCache?: typeof openResponseCache;
  send?: typeof fetch;
}
export class MaintenanceSession {
  phase = $state<"restoring" | "login" | "connecting" | "connected">(
    "restoring",
  );
  controller = $state.raw<MaintenanceController | null>(null);
  profile = $state.raw<PersonalProfile | null>(null);
  selection = $state.raw<RepositorySelection>({
    additions: [],
    exclusions: [],
  });
  error = $state("");
  repositoryDefaults = $state.raw<RepositoryDefault[]>([]);
  notice = $state("");
  cacheKind = $state("Memory cache");
  #client?: GithubTransport;
  #writer?: GithubWriteTransport;
  #reader?: GithubReadPort;
  #cache?: ResponseCache;
  #abort?: AbortController;
  #generation = 0;
  #disposed = false;
  #cleanup: Promise<void> = Promise.resolve();
  #retire(clear: boolean): Promise<void> {
    const client = this.#client,
      cache = this.#cache,
      writer = this.#writer,
      reader = this.#reader;
    client?.dispose();
    writer?.dispose();
    this.controller?.commands.dispose();
    this.controller?.disconnect();
    this.controller?.dispose();
    this.controller = null;
    this.profile = null;
    this.repositoryDefaults = [];
    this.#client = undefined;
    this.#writer = undefined;
    this.#reader = undefined;
    this.#cache = undefined;
    const previous = this.#cleanup;
    this.#cleanup = (async () => {
      await previous.catch(() => {});
      await client?.drain();
      await writer?.drain();
      await reader?.drain();
      try {
        if (clear) await cache?.clear();
      } finally {
        await cache?.close();
      }
    })();
    return this.#cleanup;
  }
  constructor(private dependencies: SessionDependencies) {
    this.selection = dependencies.store.selection();
  }
  async restore(): Promise<void> {
    try {
      const token = this.dependencies.store.token();
      if (token) await this.connect(token, true);
      else this.phase = "login";
    } catch {
      this.phase = "login";
      this.error =
        "Saved login could not be restored. Enter a token to reconnect.";
    }
  }
  async connect(token: string, remember: boolean): Promise<void> {
    const generation = ++this.#generation;
    this.#abort?.abort();
    await this.#retire(false).catch(() => {});
    if (this.#disposed || generation !== this.#generation) return;
    this.phase = "connecting";
    this.error = "";
    this.notice = "";
    const abort = (this.#abort = new AbortController());
    let auth: GithubTransport | undefined;
    let opened: Awaited<ReturnType<typeof openResponseCache>> | undefined;
    try {
      token = token.trim();
      if (!token || /[\s\x00-\x1f]/.test(token))
        throw new Error("Enter a valid GitHub token.");
      auth = new GithubTransport(
        token,
        new MemoryResponseCache(),
        this.dependencies.send,
      );
      const user = await auth.read<GithubUser>("/user", abort.signal, {
        fresh: true,
      });
      if (!Number.isInteger(user.id) || !user.login)
        throw new Error("GitHub returned an invalid user identity.");
      auth.dispose();
      const digest = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(`lapis-maintenance:v1:${user.id}:${token}`),
      );
      const partition = Array.from(new Uint8Array(digest), (byte) =>
        byte.toString(16).padStart(2, "0"),
      ).join("");
      opened = await (this.dependencies.openCache ?? openResponseCache)(
        partition,
        () => {
          if (generation !== this.#generation || this.#disposed) return;
          this.cacheKind = "Session cache · 5 min";
          this.notice =
            "Persistent cache unavailable; using a memory cache for this session.";
        },
      );
      if (this.#disposed || generation !== this.#generation) {
        await opened.cache.close();
        return;
      }
      try {
        if (remember) this.dependencies.store.remember(token);
        else this.dependencies.store.forget();
      } catch {
        this.notice =
          "Device login storage could not be updated; clear this site's browser data to remove any saved token. This session keeps its token in memory.";
      }
      this.notice ||= opened.notice ?? "";
      this.cacheKind =
        opened.cache.kind === "turso"
          ? "Cached on this device · 5 min"
          : "Session cache · 5 min";
      this.#cache = opened.cache;
      this.#client = new GithubTransport(
        token,
        opened.cache,
        this.dependencies.send,
        Date.now,
        () => {
          void this.disconnect(
            "GitHub rejected the saved token. Sign in again.",
          );
        },
      );
      const reader = new GithubReadPort(
        this.#client,
        () => this.selection,
        Date.now,
        user.login,
        opened.cache,
        (defaults) => {
          if (!this.#disposed && generation === this.#generation)
            this.repositoryDefaults = defaults;
        },
      );
      this.#reader = reader;
      this.#writer = new GithubWriteTransport(
        token,
        this.dependencies.send,
        () => {
          void this.disconnect("GitHub rejected the token. Sign in again.");
        },
      );
      this.controller = new MaintenanceController(
        reader,
        new GithubCommandPort(this.#client, this.#writer, reader),
      );
      this.profile = {
        principal: user.login,
        revision: user.id,
        avatarUrl: /^https:\/\/avatars\.githubusercontent\.com\//.test(
          user.avatar_url,
        )
          ? user.avatar_url
          : undefined,
        details: {
          display_name: user.name || user.login,
          description: `GitHub @${user.login}`,
          avatar: null,
          email: null,
          gravatar: false,
        },
      };
      this.phase = "connected";
      await this.controller.refresh();
    } catch (error) {
      if (generation !== this.#generation || this.#disposed) return;
      if (error instanceof GithubError && error.status === 401) {
        try {
          this.dependencies.store.forget();
        } catch {}
      }
      this.phase = "login";
      this.error =
        error instanceof Error && !(error instanceof TypeError)
          ? error.message
          : "Could not reach GitHub. Check your connection and retry.";
      if (opened) await opened.cache.close();
    } finally {
      auth?.dispose();
      token = "";
    }
  }
  async disconnect(message = "", forget = true): Promise<void> {
    ++this.#generation;
    this.#abort?.abort();
    const cleanup = this.#retire(true);
    this.phase = "login";
    this.error = message;
    this.notice = "";
    if (forget) {
      try {
        this.dependencies.store.forget();
      } catch {
        this.error =
          "Could not clear the saved login. Clear this site's browser data before leaving this device.";
      }
    }
    try {
      await cleanup;
    } catch {
      this.notice =
        "The cache could not be cleared. Clear this site's browser data to remove it.";
    }
  }
  async configure(selection: RepositorySelection): Promise<void> {
    this.dependencies.store.saveSelection(selection);
    this.selection = selection;
    await this.controller?.refresh();
  }
  async dispose(): Promise<void> {
    this.#disposed = true;
    ++this.#generation;
    this.#abort?.abort();
    await this.#retire(false);
  }
}
