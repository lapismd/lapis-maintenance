<script lang="ts">
  import * as Dialog from "@lapismd/design-core/shadcn/dialog";
  import * as Field from "@lapismd/design-core/shadcn/field";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import {
    Play,
    LoaderCircle,
    ExternalLink,
    X,
    ArrowLeft,
  } from "@lucide/svelte";
  import type { DispatchController } from "../../maintenance/dispatch/controller.svelte";
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
    {#if !controller.confirmation && !controller.result && repositories.length > 1}<Field.Field
        ><Field.FieldLabel for={`${id}-repository`}>Repository</Field.FieldLabel
        ><DispatchSelect
          id={`${id}-repository`}
          label="Choose repository"
          value={controller.repository}
          options={repositories.map((r) => ({ value: r, label: r }))}
          disabled={controller.loading || controller.pending}
          onChange={(value) => void controller.show(value)}
        /></Field.Field
      >{/if}
    {#if controller.loading}<p role="status">
        <LoaderCircle class="review-spinner" aria-hidden="true" />Loading
        workflow definitions…
      </p>{/if}
    {#if controller.error}<p role="alert">{controller.error}</p>{/if}
    {#if controller.result}<p role="status">{controller.result.message}</p>
      {#if controller.result.url}<a
          href={controller.result.url}
          target="_blank"
          rel="noopener noreferrer"
          ><ExternalLink aria-hidden="true" />Open workflow on GitHub</a
        >{/if}
    {:else if controller.confirmation}{@const command = controller.confirmation}
      <dl class="review-confirm-facts">
        <div>
          <dt>Workflow</dt>
          <dd>{controller.target?.workflow.name}</dd>
        </div>
        <div>
          <dt>Ref</dt>
          <dd>{command.inputs.ref}</dd>
        </div>
        <div>
          <dt>Commit</dt>
          <dd><code>{command.target.sha.slice(0, 12)}</code></dd>
        </div>
        <div>
          <dt>Definition</dt>
          <dd><code>{controller.target?.definitionSha.slice(0, 12)}</code></dd>
        </div>
        {#each Object.entries(command.inputs.workflowInputs ?? {}) as [name, value]}<div
          >
            <dt>{name}</dt>
            <dd>{value}</dd>
          </div>{/each}
        <div>
          <dt>Effect</dt>
          <dd>
            Submit this workflow once. Accepted dispatch does not confirm
            execution or publication.
          </dd>
        </div>
      </dl>
      <Dialog.Footer
        ><Button
          variant="outline"
          disabled={controller.pending}
          onclick={() => controller.cancel()}
          ><ArrowLeft aria-hidden="true" />Edit</Button
        ><Button
          disabled={controller.pending}
          onclick={() => controller.confirm()}
          ><Play aria-hidden="true" />{controller.pending
            ? "Submitting…"
            : live
              ? "Confirm workflow dispatch"
              : "Simulate workflow dispatch"}</Button
        ></Dialog.Footer
      >
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
            disabled={controller.loading}
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
            disabled={controller.loading}
            onChange={(value) =>
              void controller.select(controller.workflowId, value)}
          /></Field.Field
        ></Field.FieldGroup
      >
      {#if controller.target}<DispatchInputs {controller} />{/if}
      {#if !controller.loading && !controller.workflows.length}<p>
          No active manual workflows were discovered.
        </p>{/if}
      {#each controller.warnings as warning}<p class="review-muted">
          {warning}
        </p>{/each}
      <Dialog.Footer
        ><Button variant="outline" onclick={() => controller.close()}
          ><X aria-hidden="true" />Cancel</Button
        ><Button
          disabled={!controller.target || controller.loading}
          onclick={() => controller.prepare()}
          ><Play aria-hidden="true" />Review dispatch</Button
        ></Dialog.Footer
      >
    {/if}
  </Dialog.Content>
</Dialog.Root>
