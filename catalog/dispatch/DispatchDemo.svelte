<script lang="ts">
  import { onMount } from "svelte";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Play } from "@lucide/svelte";
  import { DispatchController } from "../../src/maintenance/dispatch/controller.svelte";
  import DispatchDialog from "../../src/components/maintenance-dispatch/DispatchDialog.svelte";
  import type {
    DispatchWorkflow,
    DispatchRef,
    DispatchTarget,
  } from "../../src/maintenance/dispatch/types";
  let {
    scenario = "accepted",
    repositories = [],
  }: {
    scenario?: "accepted" | "rejected" | "uncertain";
    repositories?: string[];
  } = $props();
  const workflow: DispatchWorkflow = {
    id: 12,
    name: "Verify release",
    path: ".github/workflows/verify.yml",
    url: "https://github.com/lapismd/lapis-maintenance/actions/workflows/verify.yml",
    inputs: [
      {
        name: "mode",
        description: "Choose validation or publication",
        type: "choice",
        required: true,
        default: "check",
        options: ["check", "publish"],
      },
      {
        name: "count",
        description: "Number of candidates",
        type: "number",
        required: true,
        default: "1",
      },
      {
        name: "enabled",
        description: "Enable extra validation",
        type: "boolean",
        required: false,
        default: "false",
      },
    ],
  };
  const ref: DispatchRef = {
    name: "main",
    kind: "branch",
    sha: "a".repeat(40),
    ref: "refs/heads/main",
  };
  const controller = new DispatchController({
    discover: async () => ({
      workflows: [workflow],
      refs: [ref],
      warnings: [],
    }),
    target: async () =>
      ({
        workflow,
        ref,
        definitionSha: "b".repeat(40),
        defaultDefinitionSha: "b".repeat(40),
        inputs: workflow.inputs,
        environments: [],
      }) satisfies DispatchTarget,
    execute: async () => ({
      status: scenario,
      message:
        scenario === "accepted"
          ? "Preview: workflow dispatch accepted. Publication is not confirmed."
          : scenario === "rejected"
            ? "Preview: workflow definition changed. Review again."
            : "Preview: response interrupted. Inspect GitHub; do not resubmit.",
      url: workflow.url,
    }),
  });
  onMount(() => () => controller.dispose());
</script>

<div
  class="maintenance-app review-ui"
  data-ui-theme="lapis"
  style="padding:2rem"
>
  <Button onclick={() => controller.show("lapismd/lapis-maintenance")}
    ><Play aria-hidden="true" />Run workflow</Button
  ><DispatchDialog {controller} {repositories} live={false} />
</div>
