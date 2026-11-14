<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { GitMerge, GitPullRequestArrow, LoaderCircle } from "@lucide/svelte";
  import type { ReviewController } from "../../maintenance/review/controller.svelte";
  import "./review.css";
  let {
    controller,
    mode = "review",
  }: { controller: ReviewController; mode?: "review" | "merge" } = $props();
  const pr = $derived(controller.overview);
  const reason = $derived(
    pr?.actionReason ??
      (pr?.state === "merged"
        ? "This pull request has been merged."
        : pr?.draft
          ? "Mark this draft ready before requesting approval."
          : !controller.resources.checks.data?.length
            ? "PR approval needs reported checks for this revision."
            : controller.resources.checks.loading
              ? "Checking the current revision…"
              : mode === "merge" && !controller.canMerge
                ? "Successful checks and maintainer approval are required before merging."
                : undefined),
  );
</script>

{#if pr?.kind === "pull-request"}
  <div class="review-pr-actions">
    {#if mode === "merge"}
      <Button
        size="sm"
        disabled={!controller.canMerge || controller.pending}
        onclick={() =>
          controller.prepare("merge-pr", pr.id, "Squash and merge")}
        ><GitMerge size={15} aria-hidden="true" />Squash and merge</Button
      >
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
    {#if reason}<p class="review-muted">{reason}</p>{/if}
  </div>
{/if}
