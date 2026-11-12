<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { ArrowBigUp, Download } from "@lucide/svelte";
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
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Update"
        title="Update"
        style="color:var(--muted-foreground)"
        disabled={busy}
        onclick={onReload}
      >
        <ArrowBigUp fill="currentColor" aria-hidden="true" />
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
