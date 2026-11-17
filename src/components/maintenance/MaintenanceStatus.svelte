<script lang="ts">
  import "./maintenance-status.css";
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
  import FeedbackFeed from "../feedback/FeedbackFeed.svelte";
  import FeedbackHost from "../feedback/FeedbackHost.svelte";
  import { provideFeedback } from "../feedback/context";
  import { maintenanceNotices } from "../../maintenance/feedback-notices";
  const feedback = provideFeedback();
  let open = $state(false);
  let {
    controller,
    notice = "",
    messages: suppliedMessages = [],
    sessionMode = "demo",
  }: {
    controller: MaintenanceController;
    notice?: string;
    messages?: string[];
    sessionMode?: "demo" | "github";
  } = $props();
  const entries = $derived.by(() => [
    ...suppliedMessages.map((message) => ({ message, kind: "warning" })),
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
    ...(controller.refreshingRepository
      ? [
          {
            message: `Refreshing ${controller.refreshingRepository}…`,
            kind: "loading",
          },
        ]
      : []),
  ]);
  const allEntries = $derived.by(() => {
    const known = new Set(entries.map((e) => e.message));
    return [
      ...feedback.center.history
        .filter((e) => !known.has(e.detail))
        .map((e) => ({
          message: e.detail,
          kind: e.severity === "error" ? "warning" : e.severity,
        })),
      ...entries,
    ];
  });
  const messages = $derived(allEntries.map((entry) => entry.message));
  const latest = $derived(
    entries.at(-1)?.message ??
      (controller.connected
        ? "Repository data is up to date"
        : "No session connected"),
  );
  const loading = $derived(
    ["loading", "refreshing"].includes(controller.phase) ||
      !!controller.refreshingRepository,
  );
</script>

<FeedbackFeed
  scope="maintenance"
  pending={["loading", "refreshing"].includes(controller.phase) ||
    !!controller.refreshingRepository ||
    controller.reports.loading}
  notices={maintenanceNotices(
    controller,
    notice,
    suppliedMessages,
    sessionMode,
    () => (open = true),
  )}
/>
{#if feedback.owned}<FeedbackHost center={feedback.center} />{/if}

<div class="maintenance-header-status">
  <Popover.Root bind:open>
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
          {#each allEntries as entry}<li>
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
