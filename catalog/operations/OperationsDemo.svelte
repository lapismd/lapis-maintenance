<script lang="ts">
  import { onMount, untrack } from "svelte";
  import OperationsFooter from "../../src/components/maintenance-operations/OperationsFooter.svelte";
  import OperationsAttention from "../../src/components/maintenance-operations/OperationsAttention.svelte";
  import MaintenanceScreen from "../../src/components/maintenance/MaintenanceScreen.svelte";
  import OperationsPanel from "../../src/components/maintenance-operations/OperationsPanel.svelte";
  import { MaintenanceController } from "../../src/maintenance/controller.svelte";
  import { operatorFixture, decisionHistoryFixture } from "./fixtures";
  import type {
    CommandResult,
    MaintenanceReadPort,
  } from "../../src/maintenance/types";
  let {
    state = "current",
    part = "page",
    shell = false,
    width,
    dark = false,
    uncertain = false,
    action = "rerun-failed",
    view = "operations",
    decisionHistory = false,
    refreshError = "",
  }: {
    part?: "page" | "attention" | "footer";
    shell?: boolean;
    width?: number;
    state?: "current" | "stale" | "unsupported" | "unavailable";
    dark?: boolean;
    uncertain?: boolean;
    action?: "rerun-failed" | "approve-run" | "approve-deployment";
    view?: "inbox" | "operations";
    decisionHistory?: boolean;
    refreshError?: string;
  } = $props();
  const snapshot = untrack(() =>
    decisionHistory ? decisionHistoryFixture() : operatorFixture(),
  );
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
  untrack(() => {
    if (refreshError)
      snapshot.repositories[0] = {
        repository: "example/consumer",
        available: false,
        reason: refreshError,
      };
  });
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
  controller.view = untrack(() => view);
  const profile = {
    principal: "fixture",
    revision: 0,
    details: {
      display_name: "Demo maintainer",
      description: "Fixture only",
      avatar: null,
      email: null,
      gravatar: false,
    },
  };
  $effect(() => {
    document.documentElement.classList.toggle("dark", dark);
  });
  onMount(() => {
    document.documentElement.classList.toggle("dark", dark);
    void controller.refresh();
    return () => {
      controller.dispose();
      document.documentElement.classList.remove("dark");
    };
  });
</script>

<div
  class="maintenance-app"
  data-ui-theme="lapis"
  style:width={width ? `${width}px` : undefined}
  style:max-width="100%"
  style:height={part === "page" ? "100dvh" : undefined}
>
  {#if shell}<MaintenanceScreen
      {controller}
      {profile}
      {dark}
      onToggleTheme={() => (dark = !dark)}
      onConnect={() => {}}
    />
  {:else if part === "footer"}<OperationsFooter {controller} />
  {:else if part === "attention"}<OperationsAttention {controller} />
  {:else}<OperationsPanel {controller} />{/if}
</div>
