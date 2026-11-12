<script lang="ts">
  import type { PwaController } from "../pwa/controller.svelte";
  import PwaControls from "../components/session/PwaControls.svelte";
  import OfflineShell from "../components/session/OfflineShell.svelte";
  import {
    bindHashNavigation,
    writeViewHash,
  } from "../session/hash-navigation";
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
  import { startVisibleRefresh } from "../session/visible-refresh";
  let { pwa }: { pwa?: PwaController } = $props();
  let offline = $state(!navigator.onLine);
  let restored = false;
  const session = new MaintenanceSession({ store: new BrowserDeviceStore() });
  let dark = $state(matchMedia("(prefers-color-scheme: dark)").matches);
  $effect(() => {
    document.documentElement.classList.toggle("dark", dark);
  });
  $effect(() => {
    if (session.controller) return startVisibleRefresh(session.controller);
  });
  $effect(() => {
    if (session.controller) return bindHashNavigation(session.controller);
  });
  $effect(() => {
    if (session.controller) writeViewHash(session.controller.view);
  });
  function reconnect() {
    offline = !navigator.onLine;
    if (offline) return;
    if (!restored) {
      restored = true;
      void session.restore();
    } else void session.controller?.refresh();
  }
  onMount(() => {
    reconnect();
    const lostConnection = () => {
      offline = true;
    };
    window.addEventListener("online", reconnect);
    window.addEventListener("offline", lostConnection);
    const synchronize = (event: StorageEvent) => {
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
  <MaintenanceScreen
    controller={session.controller}
    profile={session.profile}
    {dark}
    sessionMode="github"
    cacheLabel={session.cacheKind}
    notice={session.notice}
    onToggleTheme={() => (dark = !dark)}
    onConnect={() => {}}
    onDisconnect={() => {
      void session.disconnect();
    }}
  >
    {#snippet settings()}{@render pwaControls()}{#if session.phase === "connected"}<RepositorySettings
          {session}
        />{/if}{/snippet}
  </MaintenanceScreen>
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
