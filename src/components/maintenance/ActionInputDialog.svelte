<script lang="ts">
  import * as Dialog from "@lapismd/design-core/shadcn/dialog";
  import * as Field from "@lapismd/design-core/shadcn/field";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Input } from "@lapismd/design-core/shadcn/input";
  import { Textarea } from "@lapismd/design-core/shadcn/textarea";
  import { X, Send, LoaderCircle } from "@lucide/svelte";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  let {
    controller,
    sessionMode = "demo",
  }: { controller: MaintenanceController; sessionMode?: "demo" | "github" } =
    $props();
  let body = $state(""),
    ref = $state("");
  const draft = $derived(controller.commands.draft);
  $effect(() => {
    if (controller.commands.draft) {
      body = "";
      ref = "";
    }
  });
</script>

<Dialog.Root
  open={!!draft}
  onOpenChange={(open) => {
    if (!open) controller.commands.cancel();
  }}
>
  <Dialog.Content
    ><Dialog.Header
      ><Dialog.Title>{draft?.label ?? "Action inputs"}</Dialog.Title>
      <Dialog.Description
        >{sessionMode === "github"
          ? "Submit against the displayed target."
          : "Fixture inputs; submission is simulated in memory."}</Dialog.Description
      ></Dialog.Header
    >
    {#if draft}<form
        onsubmit={(event) => {
          event.preventDefault();
          void controller.commands.submitInput({ body, ref });
        }}
      >
        <dl class="maintenance-facts">
          <div>
            <dt>Repository</dt>
            <dd>{draft.command.repository}</dd>
          </div>
          <div>
            <dt>Revision</dt>
            <dd><code>{draft.command.target.sha.slice(0, 8)}</code></dd>
          </div>
        </dl>
        <Field.FieldGroup
          ><Field.Field>
            {#if draft.command.kind === "dispatch-workflow"}<Field.FieldLabel
                for="workflow-ref">Branch or tag</Field.FieldLabel
              ><Input
                id="workflow-ref"
                bind:value={ref}
                required
                disabled={controller.commands.busy}
              />
            {:else}<Field.FieldLabel for="action-comment"
                >Comment (required)</Field.FieldLabel
              ><Textarea
                id="action-comment"
                bind:value={body}
                required
                maxlength={65536}
                disabled={controller.commands.busy ||
                  controller.commands.inputResult?.status === "uncertain"}
              />{/if}
          </Field.Field></Field.FieldGroup
        >
        {#if controller.commands.inputResult}<p role="alert">
            {controller.commands.inputResult.message}
          </p>{/if}
        <Dialog.Footer
          ><Button
            type="button"
            variant="ghost"
            disabled={controller.commands.busy}
            onclick={() => controller.commands.cancel()}
            ><X aria-hidden="true" />Cancel</Button
          >
          <Button
            type="submit"
            disabled={controller.commands.busy ||
              controller.commands.inputResult?.status === "uncertain" ||
              !(draft.command.kind === "dispatch-workflow"
                ? ref.trim()
                : body.trim())}
          >
            {#if controller.commands.busy}<LoaderCircle
                class="maintenance-spin"
                aria-hidden="true"
              />Submitting…{:else}<Send aria-hidden="true" />{draft.command
                .kind === "dispatch-workflow"
                ? "Run workflow"
                : draft.command.kind === "request-changes"
                  ? "Request changes"
                  : "Submit comment"}{/if}
          </Button></Dialog.Footer
        >
      </form>{/if}
  </Dialog.Content>
</Dialog.Root>
