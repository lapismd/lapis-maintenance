<script lang="ts">
  import * as Dialog from "@lapismd/design-core/shadcn/dialog";
  import * as Field from "@lapismd/design-core/shadcn/field";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Play, LoaderCircle, ExternalLink, X } from "@lucide/svelte";
  import type { DispatchController } from "../../maintenance/dispatch/controller.svelte";
  import DispatchFeedback from "./DispatchFeedback.svelte";
  import DispatchRepositoryPicker from "./DispatchRepositoryPicker.svelte";
  import DispatchSelect from "./DispatchSelect.svelte";
  import DispatchInputs from "./DispatchInputs.svelte";
  let {
    controller,
    live = true,
    repositories = [],
  }: {
    controller: DispatchController;
    live?: boolean;
    repositories?: string[];
  } = $props();
  const id = $props.id();
</script>

<DispatchFeedback {controller} {live} />

<Dialog.Root
  open={controller.open}
  onOpenChange={(open) => {
    if (!open) controller.close();
  }}
>
  <Dialog.Content
    style="max-height:85dvh;overflow:auto"
    onInteractOutside={(event) => {
      if (controller.pending) event.preventDefault();
    }}
  >
    <Dialog.Header
      ><Dialog.Title>Run workflow</Dialog.Title><Dialog.Description
        >{controller.repository} · {live
          ? "Submit an existing manual workflow to GitHub. Workflows may publish or deploy using their own credentials."
          : "Fixture preview; dispatch is simulated in memory."}</Dialog.Description
      ></Dialog.Header
    >
    {#if !controller.result && repositories.length > 1}<Field.Field
        ><Field.FieldLabel for={`${id}-repository`}>Repository</Field.FieldLabel
        ><DispatchRepositoryPicker
          id={`${id}-repository`}
          value={controller.repository}
          {repositories}
          disabled={controller.loading || controller.pending}
          onChange={(value) => void controller.show(value)}
        /></Field.Field
      >{/if}
    {#if controller.loading}<p role="status">
        <LoaderCircle class="review-spinner" aria-hidden="true" />Loading
        workflow definitions…
      </p>{/if}
    {#if controller.result}
      {#if controller.result.url}<a
          href={controller.result.url}
          target="_blank"
          rel="noopener noreferrer"
          ><ExternalLink aria-hidden="true" />Open workflow on GitHub</a
        >{/if}
    {:else}<Field.FieldGroup
        ><Field.Field
          ><Field.FieldLabel for={`${id}-workflow`}>Workflow</Field.FieldLabel
          ><DispatchSelect
            id={`${id}-workflow`}
            label="Choose a workflow"
            value={controller.workflowId}
            options={controller.workflows.map((w) => ({
              value: String(w.id),
              label: w.name,
            }))}
            disabled={controller.loading || controller.pending}
            onChange={(value) => void controller.select(value, controller.ref)}
          /></Field.Field
        ><Field.Field
          ><Field.FieldLabel for={`${id}-ref`}
            >Branch or tag (required)</Field.FieldLabel
          ><DispatchSelect
            id={`${id}-ref`}
            label="Choose an explicit branch or tag"
            value={controller.ref}
            options={controller.refs.map((r) => ({
              value: r.ref,
              label: `${r.kind}: ${r.name}`,
            }))}
            disabled={controller.loading || controller.pending}
            onChange={(value) =>
              void controller.select(controller.workflowId, value)}
          /></Field.Field
        ></Field.FieldGroup
      >
      {#if controller.target}<DispatchInputs {controller} />{/if}
      {#if !controller.loading && !controller.error && !controller.workflows.length}<p
        >
          No active manual workflows were discovered.
        </p>{/if}
      {#if controller.target}<dl class="review-confirm-facts">
          <div>
            <dt>Ref</dt>
            <dd>{controller.target.ref.ref}</dd>
          </div>
          <div>
            <dt>Commit</dt>
            <dd><code>{controller.target.ref.sha.slice(0, 12)}</code></dd>
          </div>
          <div>
            <dt>Definition</dt>
            <dd><code>{controller.target.definitionSha.slice(0, 12)}</code></dd>
          </div>
        </dl>{/if}
      <Dialog.Footer
        ><Button
          variant="outline"
          disabled={controller.pending}
          onclick={() => controller.close()}
          ><X aria-hidden="true" />Cancel</Button
        ><Button
          disabled={!controller.target ||
            controller.loading ||
            controller.pending}
          onclick={() => controller.submit()}
          >{#if controller.pending}<LoaderCircle
              class="review-spinner"
              aria-hidden="true"
            />{:else}<Play aria-hidden="true" />{/if}{controller.pending
            ? "Submitting…"
            : live
              ? "Run workflow"
              : "Simulate workflow dispatch"}</Button
        ></Dialog.Footer
      >
    {/if}
  </Dialog.Content>
</Dialog.Root>
