<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { GitMerge, GitPullRequestArrow, LoaderCircle } from "@lucide/svelte";
  import type { ReviewController } from "../../maintenance/review/controller.svelte";
  import MaintenanceActionIcon from "../maintenance/MaintenanceActionIcon.svelte";
  import "./review.css";
  let {
    controller,
    mode = "review",
  }: { controller: ReviewController; mode?: "review" | "merge" } = $props();
  const pr = $derived(controller.pullRequest);
  const methods = $derived<("merge" | "squash" | "rebase")[]>(
    pr?.mergeMethods ?? ["squash"],
  );
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
  <div class="review-pr-actions">
    {#if mode === "merge"}
      {#each methods as method}<Button
          size="sm"
          disabled={!controller.canMerge || controller.pending}
          onclick={() => {
            controller.prepare(
              "merge-pr",
              pr.id,
              method === "squash"
                ? "Squash and merge"
                : method === "rebase"
                  ? "Rebase and merge"
                  : "Create merge commit",
            );
            if (controller.confirmation)
              controller.confirmation = {
                ...controller.confirmation,
                mergeMethod: method,
              };
          }}
          ><GitMerge size={15} aria-hidden="true" />{method === "squash"
            ? "Squash and merge"
            : method === "rebase"
              ? "Rebase and merge"
              : "Create merge commit"}</Button
        >{/each}
    {:else}
      <Button
        size="sm"
        variant="outline"
        disabled={!controller.canApprove || controller.pending}
        onclick={() => controller.prepare("approve-pr", pr.id, "Approve PR")}
      >
        {#if controller.pending}<LoaderCircle
            size={15}
            class="review-spinner"
            aria-hidden="true"
          />{:else}<GitPullRequestArrow
            size={15}
            aria-hidden="true"
          />{/if}Approve PR
      </Button>
    {/if}
    {#if mode === "review"}
      {#each pr.actions?.filter( (a) => ["mark-ready", "request-changes", "comment"].includes(a.kind), ) ?? [] as action}
        <Button
          size="sm"
          variant="outline"
          disabled={!action.available || controller.pending}
          title={action.reason}
          onclick={() =>
            controller.prepare(
              action.kind as import("../../maintenance/review/types").ReviewAction,
              pr.id,
              action.label,
            )}
          ><MaintenanceActionIcon kind={action.kind} />{action.label}</Button
        >
      {/each}
    {/if}
    {#if reason}<p class="review-muted">{reason}</p>{/if}
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
          controller.prepare(
            action.kind as import("../../maintenance/review/types").ReviewAction,
            controller.overview!.id,
            action.label,
          )}><MaintenanceActionIcon kind={action.kind} />{action.label}</Button
      >{/each}
  </div>{/if}
