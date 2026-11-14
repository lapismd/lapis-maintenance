<script lang="ts">
  import * as Dialog from "@lapismd/design-core/shadcn/dialog";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Textarea } from "@lapismd/design-core/shadcn/textarea";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import { LoaderCircle, X } from "@lucide/svelte";
  import MaintenanceActionIcon from "../maintenance/MaintenanceActionIcon.svelte";
  import type { ReviewController } from "../../maintenance/review/controller.svelte";
  import type { ReviewCommand } from "../../maintenance/review/types";
  let { controller }: { controller: ReviewController } = $props();
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
          >Review the identified target. This Storybook action is simulated
          entirely in memory.</Dialog.Description
        ></Dialog.Header
      >
      <Badge variant="secondary" style="width:fit-content"
        >UI preview · simulated action</Badge
      >
      <dl class="review-confirm-facts">
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
            {command.kind === "merge-pr"
              ? "Squash this revision into the base branch."
              : command.kind === "reject-environment"
                ? "Reject this environment review so its protected job does not proceed."
                : command.kind === "approve-pr"
                  ? "Record a review approval for this commit."
                  : "Allow the identified pending workflow or environment to continue. Publication is not confirmed."}
          </dd>
        </div>
      </dl>
      <label class="review-comment-label" for="review-comment"
        >Comment (optional)</label
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
          disabled={controller.pending}
          onclick={() => controller.confirm(comment)}
          >{#if controller.pending}<LoaderCircle
              size={14}
              class="review-spinner"
              aria-hidden="true"
            />Submitting…{:else}<MaintenanceActionIcon
              kind={command.kind}
            />Simulate {command.label.toLowerCase()}{/if}</Button
        ></Dialog.Footer
      >
    {/if}
  </Dialog.Content>
</Dialog.Root>
