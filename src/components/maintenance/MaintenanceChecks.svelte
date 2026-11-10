<!-- SPDX-License-Identifier: Apache-2.0; checks presentation adapted from
@lapismd/repository-ui 0.1.1 RepositoryPullRequestChecks and pull-request.css. -->
<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Empty from "@lapismd/design-core/shadcn/empty";
  import {
    CircleCheck,
    CircleX,
    CircleHelp,
    Clock,
    RefreshCw,
  } from "@lucide/svelte";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  import type { MaintenanceDetail } from "../../maintenance/types";
  let {
    detail,
    controller,
  }: { detail: MaintenanceDetail; controller: MaintenanceController } =
    $props();
  let expanded = $state(true);
  const summary = $derived(
    !detail.checks.length
      ? "No checks reported"
      : detail.checks.some((check) => check.state === "failed")
        ? "Some checks were not successful"
        : detail.checks.every((check) => check.state === "passed")
          ? "All checks have passed"
          : detail.checks.some((check) => check.state === "unknown")
            ? "Checks unavailable"
            : "Checks are running",
  );
</script>

<section class="maintenance-check-panel" aria-label="CI checks">
  <div class="maintenance-check-summary">
    <Button
      variant="ghost"
      size="sm"
      aria-expanded={expanded}
      onclick={() => (expanded = !expanded)}>{summary}</Button
    >
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Refresh checks"
      title="Refresh checks"
      disabled={controller.commands.busy}
      onclick={() => controller.select(detail.item.id)}
      ><RefreshCw aria-hidden="true" /></Button
    >
  </div>
  {#if expanded}
    <p class="maintenance-check-revision">
      Revision <code>{detail.item.target.sha.slice(0, 8)}</code>
    </p>
    {#if !detail.checks.length}
      <Empty.Root
        ><Empty.Header
          ><Empty.Media variant="icon"
            ><CircleHelp aria-hidden="true" /></Empty.Media
          ><Empty.Title>No CI checks reported</Empty.Title><Empty.Description
            >Refresh checks for the selected revision.</Empty.Description
          ></Empty.Header
        ></Empty.Root
      >
    {:else}
      <ul class="maintenance-check-list">
        {#each detail.checks as check}
          <li data-state={check.state}>
            {#if check.state === "passed"}<CircleCheck
                aria-hidden="true"
              />{:else if check.state === "failed"}<CircleX
                aria-hidden="true"
              />{:else if check.state === "unknown"}<CircleHelp
                aria-hidden="true"
              />{:else}<Clock aria-hidden="true" />{/if}
            <span
              >{check.name}<small
                >{check.state}{check.description
                  ? ` · ${check.description}`
                  : ""}</small
              ></span
            >
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</section>

<style>
  .maintenance-check-panel {
    border-top: 1px solid var(--border);
  }
  .maintenance-check-summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.35rem 0.5rem;
  }
  .maintenance-check-revision {
    margin: 0;
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
    color: var(--muted-foreground);
  }
  .maintenance-check-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .maintenance-check-list li {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    padding: 0.65rem 0.75rem;
    border-top: 1px solid var(--border);
  }
  .maintenance-check-list :global(svg) {
    width: 1rem;
    height: 1rem;
    flex: none;
  }
  .maintenance-check-list small {
    display: block;
    color: var(--muted-foreground);
    font-size: 0.75rem;
  }
  .maintenance-check-list [data-state="passed"] :global(svg) {
    color: var(--success, var(--foreground));
  }
  .maintenance-check-list [data-state="failed"] :global(svg) {
    color: var(--destructive);
  }
</style>
