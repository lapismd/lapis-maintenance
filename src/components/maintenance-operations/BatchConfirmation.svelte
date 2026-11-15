<script lang="ts">
  import * as Dialog from "@lapismd/design-core/shadcn/dialog";
  import { untrack } from "svelte";
  import { Textarea } from "@lapismd/design-core/shadcn/textarea";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  let {
    controller,
    sessionMode = "demo",
  }: { controller: MaintenanceController; sessionMode?: "demo" | "github" } =
    $props();
  let body = $state("");
  const needsBody = $derived(
    controller.commands.batchConfirmation?.commands.some(
      (c) => c.kind === "approve-deployment",
    ),
  );
  $effect(() => {
    const pending = controller.commands.batchConfirmation;
    untrack(() => {
      if (pending) body = "";
    });
  });
  const confirmation = $derived(controller.commands.batchConfirmation);
</script>

<Dialog.Root
  open={!!confirmation}
  onOpenChange={(open) => {
    if (!open) controller.commands.cancel();
  }}
>
  <Dialog.Content
    ><Dialog.Header
      ><Dialog.Title>Confirm batch actions</Dialog.Title><Dialog.Description
        >Submit each listed action once. {sessionMode === "github"
          ? "This batch changes GitHub."
          : "This fixture batch simulates the results."} Changed or ineligible targets
        will be rejected. Uncertain outcomes require inspection.</Dialog.Description
      ></Dialog.Header
    >
    <div class="operations-batch-targets">
      <ol>
        {#each confirmation?.commands ?? [] as command}<li>
            <strong>{command.kind}</strong> · {command.repository}<br
            />{command.itemId}<br /><code>{command.target.sha}</code
            >{#if command.target.kind === "workflow" || command.target.kind === "deployment"}<p
              >
                Run {command.target.runId}, attempt {command.target.attempt ??
                  1}{#if command.target.kind === "deployment"}, environment {command
                    .target.environmentId}{/if}
              </p>{/if}
          </li>{/each}
      </ol>
    </div>
    {#if needsBody}<label for="batch-environment-comment"
        >Environment approval comment</label
      ><Textarea id="batch-environment-comment" bind:value={body} />{/if}
    <Dialog.Footer
      ><Button variant="ghost" onclick={() => controller.commands.cancel()}
        >Cancel</Button
      ><Button
        disabled={controller.commands.busy || !!(needsBody && !body.trim())}
        onclick={() => controller.commands.confirmBatch({ body })}
        >Confirm listed actions</Button
      ></Dialog.Footer
    >
  </Dialog.Content>
</Dialog.Root>
