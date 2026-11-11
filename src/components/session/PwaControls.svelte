<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Download, RefreshCw } from "@lucide/svelte";
  let {
    installAvailable = false,
    updateAvailable = false,
    busy = false,
    onInstall = () => {},
    onReload = () => {},
  }: {
    installAvailable?: boolean;
    updateAvailable?: boolean;
    busy?: boolean;
    onInstall?: () => void;
    onReload?: () => void;
  } = $props();
</script>

{#if installAvailable || updateAvailable}
  <div class="maintenance-pwa-controls" aria-label="Application installation">
    {#if installAvailable}
      <Button variant="outline" size="sm" disabled={busy} onclick={onInstall}>
        <Download aria-hidden="true" />Install app
      </Button>
    {/if}
    {#if updateAvailable}
      <Button variant="outline" size="sm" disabled={busy} onclick={onReload}>
        <RefreshCw aria-hidden="true" />Reload update
      </Button>
    {/if}
  </div>
{/if}

<style>
  .maintenance-pwa-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
</style>
