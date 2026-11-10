<script lang="ts">
  import * as Dialog from "@lapismd/design-core/shadcn/dialog";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Input } from "@lapismd/design-core/shadcn/input";
  import { Textarea } from "@lapismd/design-core/shadcn/textarea";
  import { untrack } from "svelte";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  let { controller }: { controller: MaintenanceController } = $props();
  let body = $state("");
  let ref = $state("main");
  const confirmation = $derived(controller.commands.confirmation);
  const needsBody = $derived(
    confirmation &&
      [
        "request-changes",
        "comment",
        "reject-deployment",
        "approve-deployment",
      ].includes(confirmation.command.kind),
  );
  $effect(() => {
    const id = confirmation?.command.requestId;
    untrack(() => {
      if (id) {
        body = "";
        ref = "main";
      }
    });
  });
</script>

<Dialog.Root
  open={!!confirmation}
  onOpenChange={(open) => {
    if (!open) controller.commands.cancel();
  }}
>
  <Dialog.Content>
    <Dialog.Header
      ><Dialog.Title>{confirmation?.label ?? "Confirm action"}</Dialog.Title
      ><Dialog.Description
        >Confirm this operation against the displayed target. The Storybook
        session simulates the result.</Dialog.Description
      ></Dialog.Header
    >
    {#if confirmation}
      <dl class="maintenance-facts">
        <div>
          <dt>Repository</dt>
          <dd>{confirmation.command.repository}</dd>
        </div>
        <div>
          <dt>Revision</dt>
          <dd><code>{confirmation.command.target.sha.slice(0, 8)}</code></dd>
        </div>
        {#if confirmation.command.target.kind === "workflow"}<div>
            <dt>Attempt</dt>
            <dd>{confirmation.command.target.attempt}</dd>
          </div>{/if}{#if confirmation.command.inputs.mergeMethod}<div>
            <dt>Merge method</dt>
            <dd>{confirmation.command.inputs.mergeMethod}</dd>
          </div>{/if}
      </dl>
      {#if needsBody}<label for="action-comment">Comment</label><Textarea
          id="action-comment"
          bind:value={body}
          placeholder="Explain this decision…"
        />{/if}
      {#if confirmation.command.kind === "dispatch-workflow"}<label
          for="workflow-ref">Branch or tag</label
        ><Input id="workflow-ref" bind:value={ref} />
        <p class="maintenance-muted">
          Demo workflow: release.yml. Live input discovery belongs to Slice 4.
        </p>{/if}
    {/if}
    <Dialog.Footer
      ><Button variant="ghost" onclick={() => controller.commands.cancel()}
        >Cancel</Button
      ><Button
        disabled={controller.commands.busy ||
          !!(needsBody && !body.trim()) ||
          (confirmation?.command.kind === "dispatch-workflow" && !ref.trim())}
        onclick={() => controller.commands.confirm({ body, ref })}
        >Confirm simulated action</Button
      ></Dialog.Footer
    >
  </Dialog.Content>
</Dialog.Root>
