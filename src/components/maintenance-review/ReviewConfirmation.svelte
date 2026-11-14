<script lang="ts">
  import * as Dialog from "@lapismd/design-core/shadcn/dialog";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Textarea } from "@lapismd/design-core/shadcn/textarea";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import { LoaderCircle, X } from "@lucide/svelte";
  import MaintenanceActionIcon from "../maintenance/MaintenanceActionIcon.svelte";
  import type { ReviewController } from "../../maintenance/review/controller.svelte";
  import type { ReviewCommand } from "../../maintenance/review/types";
  let {
    controller,
    live = false,
  }: { controller: ReviewController; live?: boolean } = $props();
  let comment = $state("");
  let lastCommand = $state.raw<ReviewCommand | null>(null);
  const command = $derived(controller.confirmation ?? lastCommand);
  $effect(() => {
    if (controller.confirmation) {
      lastCommand = controller.confirmation;
      comment = "";
    }
  });
</script>

<Dialog.Root
  open={!!controller.confirmation}
  onOpenChange={(open) => {
    if (!open) controller.cancel();
  }}
>
  <Dialog.Content
    onInteractOutside={(event) => {
      if (controller.pending) event.preventDefault();
    }}
  >
    {#if command}
      <Dialog.Header
        ><Dialog.Title>{command.label}</Dialog.Title><Dialog.Description
          >{live
            ? "This action changes GitHub. The target will be checked again immediately before submission."
            : "Review the identified target. This Storybook action is simulated entirely in memory."}</Dialog.Description
        ></Dialog.Header
      >
      <Badge variant="secondary" style="width:fit-content"
        >{live ? "GitHub action" : "UI preview · simulated action"}</Badge
      >
      <dl class="review-confirm-facts">
        {#if ["approve-pr", "merge-pr", "enable-auto-merge", "disable-auto-merge", "mark-ready", "request-changes", "comment"].includes(command.kind)}<div
          >
            <dt>Pull request</dt>
            <dd>#{controller.pullRequest?.number}</dd>
          </div>{/if}
        <div>
          <dt>Repository</dt>
          <dd>{controller.overview?.repository}</dd>
        </div>
        <div>
          <dt>Revision</dt>
          <dd><code>{command.sha.slice(0, 12)}</code></dd>
        </div>
        {#if command.runId}<div>
            <dt>Workflow run</dt>
            <dd>#{command.runId} · attempt {command.attempt}</dd>
          </div>{/if}{#if command.environment}<div>
            <dt>Environment</dt>
            <dd>{command.environment}</dd>
          </div>{/if}
        <div>
          <dt>Effect</dt>
          <dd>
            {command.kind === "enable-auto-merge"
              ? `Ask GitHub to automatically ${command.mergeMethod} and merge this PR when its required checks and reviews are satisfied.`
              : command.kind === "disable-auto-merge"
                ? "Stop GitHub from automatically merging this PR. The pull request stays open."
                : command.kind === "merge-pr"
                  ? command.mergeMethod === "squash"
                    ? "Squash this revision into the base branch."
                    : `Merge this revision into the base branch using ${command.mergeMethod}.`
                  : command.kind === "reject-environment"
                    ? "Reject this environment review so its protected job does not proceed."
                    : command.kind === "approve-pr"
                      ? "Record a review approval for this commit."
                      : command.kind === "mark-ready"
                        ? "Mark this draft ready for review."
                        : command.kind === "comment"
                          ? "Submit a review comment on this revision."
                          : command.kind === "request-changes"
                            ? "Request changes on this revision."
                            : command.kind === "rerun-failed"
                              ? "Start another attempt of failed workflow jobs."
                              : command.kind === "cancel-run"
                                ? "Cancel this identified running workflow attempt."
                                : "Allow the identified pending workflow or environment to continue. Publication is not confirmed."}
          </dd>
        </div>
      </dl>
      <label class="review-comment-label" for="review-comment"
        >{command.kind === "comment" || command.kind === "request-changes"
          ? "Comment (required)"
          : "Comment (optional)"}</label
      ><Textarea
        id="review-comment"
        bind:value={comment}
        disabled={controller.pending}
        placeholder="Add context for this decision…"
      />
      <Dialog.Footer
        ><Button
          variant="outline"
          disabled={controller.pending}
          onclick={() => controller.cancel()}
          ><X size={15} aria-hidden="true" />Cancel</Button
        ><Button
          disabled={controller.pending ||
            (["comment", "request-changes"].includes(command.kind) &&
              !comment.trim())}
          aria-label={live ? "Confirm GitHub action" : undefined}
          onclick={() => controller.confirm(comment)}
          >{#if controller.pending}<LoaderCircle
              size={14}
              class="review-spinner"
              aria-hidden="true"
            />Submitting…{:else}<MaintenanceActionIcon
              kind={command.kind}
            />{live ? "Confirm" : "Simulate"}
            {command.label.toLowerCase()}{/if}</Button
        ></Dialog.Footer
      >
    {/if}
  </Dialog.Content>
</Dialog.Root>
