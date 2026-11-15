<script lang="ts">
  import * as Dialog from "@lapismd/design-core/shadcn/dialog";
  import * as Field from "@lapismd/design-core/shadcn/field";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Textarea } from "@lapismd/design-core/shadcn/textarea";
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
  const command = $derived(controller.draft ?? lastCommand);
  $effect(() => {
    if (controller.draft) {
      lastCommand = controller.draft;
      comment = "";
    }
  });
</script>

<Dialog.Root
  open={!!controller.draft}
  onOpenChange={(open) => {
    if (!open) controller.cancel();
  }}
>
  <Dialog.Content
    onInteractOutside={(event) => {
      if (controller.pending) event.preventDefault();
    }}
  >
    <Dialog.Header
      ><Dialog.Title>{command?.label ?? "Review comment"}</Dialog.Title>
      <Dialog.Description
        >{live
          ? "Submit your review for the displayed PR revision."
          : "Fixture preview; submitting this review is simulated in memory."}</Dialog.Description
      ></Dialog.Header
    >
    {#if command}<form
        onsubmit={(event) => {
          event.preventDefault();
          void controller.submitInput(comment);
        }}
      >
        <dl class="review-confirm-facts">
          <div>
            <dt>Repository</dt>
            <dd>{command.repository ?? controller.overview?.repository}</dd>
          </div>
          <div>
            <dt>Revision</dt>
            <dd><code>{command.sha.slice(0, 12)}</code></dd>
          </div>
        </dl>
        <Field.FieldGroup
          ><Field.Field
            ><Field.FieldLabel for="review-comment"
              >Comment (required)</Field.FieldLabel
            >
            <Textarea
              id="review-comment"
              bind:value={comment}
              required
              maxlength={65536}
              disabled={controller.pending ||
                controller.inputResult?.status === "uncertain"}
            /></Field.Field
          ></Field.FieldGroup
        >
        {#if controller.inputResult}<p role="alert">
            {controller.inputResult.message}
          </p>{/if}
        <Dialog.Footer
          ><Button
            type="button"
            variant="outline"
            disabled={controller.pending}
            onclick={() => controller.cancel()}
            ><X aria-hidden="true" />Cancel</Button
          >
          <Button
            type="submit"
            disabled={controller.pending ||
              !comment.trim() ||
              controller.inputResult?.status === "uncertain"}
          >
            {#if controller.pending}<LoaderCircle
                class="review-spinner"
                aria-hidden="true"
              />Submitting…{:else}<MaintenanceActionIcon
                kind={command.kind}
              />{command.kind === "request-changes"
                ? "Request changes"
                : "Submit comment"}{/if}
          </Button></Dialog.Footer
        >
      </form>{/if}
  </Dialog.Content>
</Dialog.Root>
