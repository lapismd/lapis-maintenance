<script lang="ts">
  import { onDestroy, untrack } from "svelte";
  import ActivityFeed from "../../src/components/maintenance-activity/ActivityFeed.svelte";
  import ActivityContext from "../../src/components/maintenance-activity/ActivityContext.svelte";
  import ActivityEntry from "../../src/components/maintenance-activity/ActivityEntry.svelte";
  import { ActivityController } from "../../src/maintenance/activity/controller.svelte";
  import { MemoryActivityPort, type ActivityScenario } from "./memory-port";
  let {
    part = "feed",
    scenario = "populated",
    outcome,
  }: {
    part?: "feed" | "entry";
    scenario?: ActivityScenario;
    outcome?: "success" | "failure";
  } = $props();
  const port = untrack(() => new MemoryActivityPort(scenario));
  const controller = new ActivityController(port);
  const query = { search: "", repositories: [], statuses: [] };
  onDestroy(() => controller.dispose());
</script>

<div
  class="maintenance-app"
  data-ui-theme="lapis"
  style="height:100dvh;display:flex;flex-direction:column;min-height:0;padding:1rem"
>
  {#if part === "entry"}<ActivityEntry
      event={{ ...port.events[0]!, outcome }}
      repository={port.events[0]!.repository}
      status={port.events[0]!.status}
      connect={false}
    />
  {:else}<ActivityContext {controller} /><ActivityFeed
      {controller}
      {query}
      onOpen={() => {}}
      onRepository={() => {}}
    />{/if}
</div>
