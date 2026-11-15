<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Skeleton } from "@lapismd/design-core/shadcn/skeleton";
  import * as Empty from "@lapismd/design-core/shadcn/empty";
  import { Unplug, Link2 } from "@lucide/svelte";
  import OperationsAttention from "../maintenance-operations/OperationsAttention.svelte";
  import OperationsPanel from "../maintenance-operations/OperationsPanel.svelte";
  import MaintenanceBoard from "./MaintenanceBoard.svelte";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  let {
    controller,
    onConnect,
    sessionMode = "demo",
    onPrefetch,
    onOpen = (id: string) => {
      void controller.select(id);
    },
  }: {
    controller: MaintenanceController;
    sessionMode?: "demo" | "github";
    onConnect: () => void;
    onOpen?: (id: string) => void;
    onPrefetch?: (id: string, signal: AbortSignal) => Promise<unknown>;
  } = $props();
</script>

<div
  class="maintenance-main"
  class:maintenance-main-operations={controller.view === "operations"}
>
  {#if !controller.connected}<Empty.Root
      ><Empty.Header
        ><Empty.Media variant="icon"><Unplug aria-hidden="true" /></Empty.Media
        ><Empty.Title>Connect a session</Empty.Title><Empty.Description
          >Explore the dashboard with an in-memory maintainer session. No real
          GitHub token is needed.</Empty.Description
        ></Empty.Header
      ><Empty.Content
        ><Button onclick={onConnect}
          ><Link2 size={16} aria-hidden="true" />Connect demo session</Button
        ></Empty.Content
      ></Empty.Root
    >
  {:else if controller.view === "operations"}
    <OperationsPanel {controller} {sessionMode} />
  {:else}
    <div class="maintenance-board-heading">
      <h2>
        {controller.items.length}
        {controller.items.length === 1 ? "item" : "items"} in view
      </h2>
      <span
        >{controller.view === "activity"
          ? "Grouped by latest update"
          : "Columns reflect observed status"}</span
      >
    </div>
    {#if controller.view === "inbox"}<OperationsAttention {controller} />{/if}
    {#if controller.phase === "loading" && !controller.snapshot?.items.length}<div
        class="maintenance-loading"
        role="status"
        aria-label="Loading maintenance items"
      >
        {#each [1, 2, 3] as n (n)}<div>
            <Skeleton style="height:1.8rem;width:60%" /><Skeleton
              style="height:12rem;width:100%"
            /><Skeleton style="height:9rem;width:100%" />
          </div>{/each}
      </div>
    {:else if controller.snapshot}<MaintenanceBoard
        {controller}
        {onOpen}
        {onPrefetch}
      />{/if}
  {/if}
</div>
