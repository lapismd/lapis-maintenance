<script lang="ts">
  import { onMount } from "svelte";
  import MaintenanceScreen from "../components/maintenance/MaintenanceScreen.svelte";
  import TokenLogin from "../components/session/TokenLogin.svelte";
  import RepositorySettings from "../components/session/RepositorySettings.svelte";
  import { MaintenanceSession } from "../session/session.svelte";
  import { BrowserDeviceStore, credentialKey } from "../session/device-store";
  import { startVisibleRefresh } from "../session/visible-refresh";
  const session = new MaintenanceSession({ store: new BrowserDeviceStore() });
  let dark = $state(matchMedia("(prefers-color-scheme: dark)").matches);
  $effect(() => {
    document.documentElement.classList.toggle("dark", dark);
  });
  $effect(() => {
    if (session.controller) return startVisibleRefresh(session.controller);
  });
  onMount(() => {
    void session.restore();
    const synchronize = (event: StorageEvent) => {
      if (event.key === credentialKey)
        void session.disconnect(
          "The session changed in another tab. Reconnect to continue.",
          false,
        );
    };
    window.addEventListener("storage", synchronize);
    return () => {
      window.removeEventListener("storage", synchronize);
      void session.dispose();
    };
  });
</script>

{#if session.controller && session.profile}
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
    {#snippet settings()}<RepositorySettings {session} />{/snippet}
  </MaintenanceScreen>
{:else}
  <TokenLogin
    busy={session.phase === "connecting"}
    restoring={session.phase === "restoring"}
    error={session.error}
    notice={session.notice}
    onConnect={(token, remember) => session.connect(token, remember)}
  />
{/if}
