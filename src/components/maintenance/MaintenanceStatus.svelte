<script lang="ts">
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import {
    CircleAlert,
    LoaderCircle,
    CheckCircle2,
    Pause,
    Info,
    CircleHelp,
  } from "@lucide/svelte";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  let {
    controller,
    notice = "",
  }: { controller: MaintenanceController; notice?: string } = $props();
  const entries = $derived.by(() => [
    ...(notice ? [{ message: notice, kind: "info" }] : []),
    ...(controller.snapshot?.repositories
      .filter((repo) => repo.holdReason)
      .map((repo) => ({
        message: `${repo.repository}: ${repo.holdReason}`,
        kind: "hold",
      })) ?? []),
    ...controller.unavailable.map((repo) => ({
      message: `${repo.repository} — ${repo.reason ?? "Data unavailable."}`,
      kind: "warning",
    })),
    ...controller.commands.receipts
      .filter((receipt) => receipt.command.itemId !== controller.selectedId)
      .map((receipt) => ({
        message: `${receipt.command.repository} · ${receipt.status}: ${receipt.message}`,
        kind: receipt.status,
      })),
    ...(controller.error
      ? [{ message: controller.error.message, kind: "warning" }]
      : []),
    ...(["loading", "refreshing"].includes(controller.phase)
      ? [
          {
            message: "Loading repositories and current GitHub activity…",
            kind: "loading",
          },
        ]
      : []),
  ]);
  const messages = $derived(entries.map((entry) => entry.message));
  const latest = $derived(
    messages.at(-1) ??
      (controller.connected
        ? "Repository data is up to date"
        : "No session connected"),
  );
  const loading = $derived(
    ["loading", "refreshing"].includes(controller.phase),
  );
</script>

<div class="maintenance-header-status">
  <Popover.Root>
    <Popover.Trigger>
      {#snippet child({ props })}
        <Button
          {...props}
          variant="ghost"
          size="sm"
          class="maintenance-status-trigger"
          title={latest}
        >
          <span class="maintenance-sr-only">Open status log: </span>
          {#if loading}<LoaderCircle
              class="maintenance-status-spinner"
              size={14}
              aria-hidden="true"
            />{:else if messages.length}<CircleAlert
              size={14}
              aria-hidden="true"
            />{:else}<CheckCircle2 size={14} aria-hidden="true" />{/if}
          <span class="maintenance-status-latest">{latest}</span><Badge
            variant="secondary">{messages.length}</Badge
          >
          <span class="maintenance-sr-only"> items</span>
        </Button>
      {/snippet}
    </Popover.Trigger>
    <Popover.Content
      align="center"
      sideOffset={8}
      collisionPadding={12}
      style="width:min(36rem,calc(100vw - 2rem))"
      role="region"
      aria-label="Status log"
    >
      <div class="maintenance-status-heading">
        <strong>Status log</strong><Badge variant="secondary"
          >{messages.length} items</Badge
        >
      </div>
      {#if messages.length}<ol class="maintenance-status-messages">
          {#each entries as entry}<li>
              <span class="maintenance-status-marker" data-kind={entry.kind}>
                {#if entry.kind === "hold"}<Pause
                    size={14}
                    aria-hidden="true"
                  />
                {:else if entry.kind === "warning" || entry.kind === "rejected"}<CircleAlert
                    size={14}
                    aria-hidden="true"
                  />
                {:else if entry.kind === "loading" || entry.kind === "accepted"}<LoaderCircle
                    class="maintenance-status-spinner"
                    size={14}
                    aria-hidden="true"
                  />
                {:else if entry.kind === "completed"}<CheckCircle2
                    size={14}
                    aria-hidden="true"
                  />
                {:else if entry.kind === "uncertain"}<CircleHelp
                    size={14}
                    aria-hidden="true"
                  />
                {:else}<Info size={14} aria-hidden="true" />{/if}
              </span><span>{entry.message}</span>
            </li>{/each}
        </ol>{:else}<p class="maintenance-muted">{latest}</p>{/if}
      {#if controller.error}<Button
          variant="outline"
          size="sm"
          onclick={() => controller.refresh(true)}>Retry refresh</Button
        >{/if}
    </Popover.Content>
  </Popover.Root>
</div>

<style>
  .maintenance-header-status {
    flex: 1 1 0;
    width: 20rem;
    max-width: 20rem;
    min-width: 0;
    display: flex;
    justify-content: center;
    overflow: hidden;
    margin-inline: auto;
  }
  .maintenance-header-status :global(.maintenance-status-trigger) {
    max-width: 100%;
    width: 100%;
    min-width: 0;
    overflow: hidden;
    gap: 0.4rem;
    color: var(--muted-foreground);
  }
  .maintenance-header-status :global(svg),
  .maintenance-header-status :global([data-slot="badge"]) {
    flex: none;
  }
  .maintenance-status-latest {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .maintenance-status-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.75rem;
    font-size: 0.85rem;
  }
  .maintenance-status-messages {
    max-height: min(24rem, 65dvh);
    overflow: auto;
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: 0.8rem;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }
  .maintenance-status-messages li {
    position: relative;
    display: grid;
    grid-template-columns: 1.5rem minmax(0, 1fr);
    gap: 0.65rem;
    padding: 0.4rem 0.1rem 0.8rem;
  }
  .maintenance-status-messages li:not(:last-child)::before {
    content: "";
    position: absolute;
    left: 0.8rem;
    width: 1px;
    top: 1.9rem;
    bottom: -0.4rem;
    background: var(--border);
  }
  .maintenance-status-marker {
    width: 1.5rem;
    height: 1.5rem;
    border: 1px solid var(--border);
    border-radius: 50%;
    display: grid;
    place-items: center;
    color: var(--muted-foreground);
    background: var(--background);
  }
  .maintenance-status-marker[data-kind="warning"],
  .maintenance-status-marker[data-kind="rejected"] {
    color: var(--destructive);
  }
  :global(.maintenance-status-spinner) {
    animation: maintenance-status-spin 1s linear infinite;
  }
  @keyframes maintenance-status-spin {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    :global(.maintenance-status-spinner) {
      animation: none;
    }
  }
</style>
