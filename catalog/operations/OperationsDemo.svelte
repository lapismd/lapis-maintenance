<script lang="ts">
  import { onMount, untrack } from "svelte";
  import OperationsPanel from "../../src/components/maintenance-operations/OperationsPanel.svelte";
  import { MaintenanceController } from "../../src/maintenance/controller.svelte";
  import { operatorFixture } from "./fixtures";
  import type {
    CommandResult,
    MaintenanceReadPort,
  } from "../../src/maintenance/types";
  let {
    state = "current",
    dark = false,
    uncertain = false,
    action = "rerun-failed",
  }: {
    state?: "current" | "stale" | "unsupported" | "unavailable";
    dark?: boolean;
    uncertain?: boolean;
    action?: "rerun-failed" | "approve-run" | "approve-deployment";
  } = $props();
  const snapshot = operatorFixture();
  snapshot.coordinator!.state = untrack(() => state);
  if (untrack(() => state === "unsupported" || state === "unavailable")) {
    snapshot.coordinator!.report = undefined;
    snapshot.coordinator!.reason =
      "Coordinator report unavailable. Manual controls remain available.";
  }
  untrack(() => {
    if (action !== "rerun-failed")
      for (const item of snapshot.items) {
        item.status = "approval-wait";
        item.actions = [
          { kind: action, label: "Approve eligible fixture", available: true },
        ];
        if (
          action === "approve-deployment" &&
          item.target.kind === "workflow"
        ) {
          item.target = {
            ...item.target,
            kind: "deployment",
            environmentId: 101,
          };
          item.id = `deployment:${item.repository}:${item.target.runId}:101`;
        }
      }
  });
  const read: MaintenanceReadPort = {
    readSnapshot: async () => snapshot,
    refreshRepository: async () => snapshot,
    readDetails: async (id) => ({
      item: snapshot.items.find((i) => i.id === id)!,
      description: "Fixture only",
      checks: [],
    }),
  };
  let calls = 0;
  const controller = new MaintenanceController(read, {
    execute: async (): Promise<CommandResult> =>
      ++calls === 2 && uncertain
        ? {
            status: "uncertain",
            message: "Fixture outcome unknown. Inspect before retrying.",
          }
        : { status: "accepted", message: "Fixture rerun accepted." },
  });
  controller.view = "operations";
  onMount(() => {
    document.documentElement.classList.toggle("dark", dark);
    void controller.refresh();
    return () => {
      controller.dispose();
      document.documentElement.classList.remove("dark");
    };
  });
</script>

<div class="maintenance-app" data-ui-theme="lapis">
  <OperationsPanel {controller} />
</div>
