<script lang="ts">
  import type { PwaController } from "../pwa/controller.svelte";
  import PwaControls from "../components/session/PwaControls.svelte";
  import OfflineShell from "../components/session/OfflineShell.svelte";
  import {
    bindWorkspaceNavigation,
    writeWorkspaceHash,
  } from "../session/workspace-navigation";
  import ReviewShell from "../components/maintenance-review/ReviewShell.svelte";
  import { onMount } from "svelte";
  import MaintenanceScreen from "../components/maintenance/MaintenanceScreen.svelte";
  import TokenLogin from "../components/session/TokenLogin.svelte";
  import RepositorySettings from "../components/session/RepositorySettings.svelte";
  import { MaintenanceSession } from "../session/session.svelte";
  import {
    BrowserDeviceStore,
    credentialKey,
    sameRememberedToken,
  } from "../session/device-store";
  import { startReviewRefresh } from "../session/review-refresh";
  import { startVisibleRefresh } from "../session/visible-refresh";
  import {
    BrowserThemePreferenceStore,
    parseThemePreference,
    themePreferenceKey,
  } from "../session/theme-preference";
  let { pwa }: { pwa?: PwaController } = $props();
  let offline = $state(!navigator.onLine);
  let restored = false;
  const session = new MaintenanceSession({ store: new BrowserDeviceStore() });
  const themePreferences = new BrowserThemePreferenceStore();
  let dark = $state(
    themePreferences.read(
      matchMedia("(prefers-color-scheme: dark)").matches,
    ) === "dark",
  );
  $effect(() => {
    document.documentElement.classList.toggle("dark", dark);
  });
  $effect(() => {
    if (session.controller) return startVisibleRefresh(session.controller);
  });
  $effect(() => {
    if (session.controller && session.live)
      return bindWorkspaceNavigation(session.controller, session.live.review);
  });
  $effect(() => {
    if (session.controller && session.live)
      writeWorkspaceHash(session.controller, session.live.review);
  });
  $effect(() => {
    if (session.live) return startReviewRefresh(session.live.review);
  });
  function reconnect() {
    offline = !navigator.onLine;
    if (offline) return;
    if (!restored) {
      restored = true;
      void session.restore();
    } else void session.controller?.refresh();
  }
  function toggleTheme() {
    dark = !dark;
    themePreferences.write(dark ? "dark" : "light");
  }
  onMount(() => {
    reconnect();
    const lostConnection = () => {
      offline = true;
    };
    window.addEventListener("online", reconnect);
    window.addEventListener("offline", lostConnection);
    const synchronize = (event: StorageEvent) => {
      if (event.key === themePreferenceKey) {
        const preference = parseThemePreference(event.newValue);
        if (preference) dark = preference === "dark";
      }
      if (
        event.key === credentialKey &&
        !sameRememberedToken(event.oldValue, event.newValue)
      )
        void session.disconnect(
          "The session changed in another tab. Reconnect to continue.",
          false,
        );
    };
    window.addEventListener("storage", synchronize);
    return () => {
      window.removeEventListener("storage", synchronize);
      window.removeEventListener("online", reconnect);
      window.removeEventListener("offline", lostConnection);
      pwa?.dispose();
      void session.dispose();
    };
  });
</script>

{#snippet pwaControls()}
  <PwaControls
    installAvailable={pwa?.installAvailable}
    updateAvailable={pwa?.updateAvailable}
    busy={session.phase === "connecting" ||
      session.phase === "restoring" ||
      session.controller?.commands.busy ||
      session.live?.review.pending ||
      session.live?.dispatch.pending ||
      pwa?.installing}
    onInstall={() => {
      void pwa?.install();
    }}
    onReload={() => pwa?.reloadUpdate()}
  />
{/snippet}
{#if offline}
  <OfflineShell onReconnect={reconnect} />
{:else if session.controller && session.profile}
  {#if session.live}<ReviewShell
      inbox={session.controller}
      activity={session.live.activity}
      review={session.live.review}
      dispatch={session.live.dispatch}
      profile={session.profile}
      {dark}
      sessionMode="github"
      cacheLabel={session.cacheKind}
      notice={session.notice}
      onToggleTheme={toggleTheme}
      onDisconnect={() => {
        void session.disconnect();
      }}
      onPrefetch={(id, signal) => session.live!.resources.prefetch(id, signal)}
    >
      {#snippet settings()}{@render pwaControls()}<RepositorySettings
          {session}
        />{/snippet}
    </ReviewShell>{:else}
    <MaintenanceScreen
      controller={session.controller}
      profile={session.profile}
      {dark}
      sessionMode="github"
      cacheLabel={session.cacheKind}
      notice={session.notice}
      onToggleTheme={toggleTheme}
      onConnect={() => {}}
      onDisconnect={() => {
        void session.disconnect();
      }}
    >
      {#snippet settings()}{@render pwaControls()}{#if session.phase === "connected"}<RepositorySettings
            {session}
          />{/if}{/snippet}
    </MaintenanceScreen>{/if}
{:else}
  <TokenLogin
    busy={session.phase === "connecting"}
    restoring={session.phase === "restoring"}
    error={session.error}
    notice={session.notice}
    onConnect={(token, remember) => session.connect(token, remember)}
    actions={pwaControls}
  />
{/if}
