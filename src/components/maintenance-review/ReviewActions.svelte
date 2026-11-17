<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import type { ReviewController } from "../../maintenance/review/controller.svelte";
  import ReviewMergeControl from "./ReviewMergeControl.svelte";
  import MaintenanceActionIcon from "../maintenance/MaintenanceActionIcon.svelte";
  import "./review.css";
  let {
    controller,
    mode = "review",
    compact = false,
  }: {
    controller: ReviewController;
    mode?: "review" | "merge";
    compact?: boolean;
  } = $props();
  const id = $props.id();
  const pr = $derived(controller.pullRequest);
  const reason = $derived(
    (mode === "merge" ? pr?.mergeReason : pr?.actionReason) ??
      (pr?.state !== "open"
        ? "This pull request is closed."
        : pr?.draft
          ? "Mark this draft ready before taking this action."
          : mode === "merge"
            ? controller.canMerge
              ? "GitHub applies repository checks and approval rules when merging."
              : "Merge permission and a current pull request target are required."
            : !controller.resources.checks.data?.length
              ? "PR approval needs reported checks for this revision."
              : controller.resources.checks.loading
                ? "Checking the current revision…"
                : undefined),
  );
</script>

{#if pr?.kind === "pull-request"}
  <div class="review-pr-actions" class:review-pr-actions-compact={compact}>
    {#if mode === "merge"}
      <ReviewMergeControl {controller} />
    {:else}
      <Button
        size="sm"
        variant="outline"
        title={reason ?? "Approve PR"}
        aria-describedby={reason ? `${id}-reason` : undefined}
        disabled={!controller.canApprove || controller.pending}
        onclick={() => controller.invoke("approve-pr", pr.id, "Approve PR")}
      >
        <MaintenanceActionIcon
          kind="approve-pr"
          pending={controller.active?.kind === "approve-pr" &&
            controller.active?.itemId === controller.selectedId}
        /><span class="review-action-label">Approve PR</span>
      </Button>
    {/if}
    {#if mode === "review"}
      {#each pr.actions?.filter( (a) => ["mark-ready", "request-changes", "comment"].includes(a.kind), ) ?? [] as action}
        <Button
          size="sm"
          variant="outline"
          disabled={!action.available || controller.pending}
          title={action.reason ??
            (action.kind === "comment" ? "Comment" : action.label)}
          aria-describedby={action.reason
            ? `${id}-${action.kind}-reason`
            : undefined}
          onclick={() =>
            controller.invoke(
              action.kind as import("../../maintenance/review/types").ReviewAction,
              pr.id,
              action.label,
            )}
          ><MaintenanceActionIcon
            kind={action.kind}
            pending={controller.active?.kind === action.kind &&
              controller.active?.targetId === pr.id}
          /><span class="review-action-label"
            >{action.kind === "comment" ? "Comment" : action.label}</span
          ></Button
        >
        {#if action.reason}<span
            id={`${id}-${action.kind}-reason`}
            class="maintenance-sr-only">{action.reason}</span
          >{/if}
      {/each}
    {/if}
    {#if reason}
      {#if compact}<span id={`${id}-reason`} class="maintenance-sr-only"
          >{reason}</span
        >
      {:else}<p id={`${id}-reason`} class="review-muted">{reason}</p>{/if}
    {/if}
  </div>
{/if}

{#if mode === "review" && controller.overview && controller.overview.kind !== "pull-request"}<div
    class="review-pr-actions"
  >
    {#each controller.overview.actions?.filter( (a) => ["rerun-failed", "cancel-run"].includes(a.kind), ) ?? [] as action}<Button
        size="sm"
        variant="outline"
        disabled={!action.available || controller.pending}
        title={action.reason}
        onclick={() =>
          controller.invoke(
            action.kind as import("../../maintenance/review/types").ReviewAction,
            controller.overview!.id,
            action.label,
          )}
        ><MaintenanceActionIcon
          kind={action.kind}
          pending={controller.active?.kind === action.kind &&
            controller.active?.targetId === controller.overview!.id}
        /><span class="review-action-label"
          >{action.kind === "comment" ? "Comment" : action.label}</span
        ></Button
      >{/each}
  </div>{/if}
