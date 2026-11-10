<script lang="ts">
  import { onMount, untrack } from "svelte";
  import MaintenanceScreen from "../src/components/maintenance/MaintenanceScreen.svelte";
  import { MaintenanceController } from "../src/maintenance/controller.svelte";
  import { MemoryMaintenancePort, type Scenario } from "./memory-port";
  let {
    scenario = "populated",
    theme = "light",
    width,
  }: {
    scenario?: Scenario;
    theme?: "light" | "dark";
    width?: number;
  } = $props();
  const port = untrack(() => new MemoryMaintenancePort(scenario));
  const controller = untrack(
    () => new MaintenanceController(port, port, scenario !== "disconnected"),
  );
  const profile = {
    principal: "demo-maintainer",
    revision: 0,
    details: {
      display_name: "Demo maintainer",
      description: "In-memory review session",
      avatar: null,
      email: null,
      gravatar: false,
    },
  };
  let dark = $state(untrack(() => theme === "dark"));
  $effect(() => {
    document.documentElement.classList.toggle("dark", dark);
  });
  onMount(() => {
    if (controller.connected)
      void controller.refresh().then(() => {
        if (scenario === "refreshing") void controller.refresh();
      });
    return () => {
      controller.dispose();
      document.documentElement.classList.remove("dark");
    };
  });
</script>

<div style:width={width ? `${width}px` : "100%"} style:max-width="100%">
  <MaintenanceScreen
    {controller}
    {profile}
    {dark}
    onToggleTheme={() => (dark = !dark)}
    onConnect={() => controller.connect()}
  />
</div>
