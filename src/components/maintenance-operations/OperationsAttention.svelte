<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  import { attentionReason } from "../../maintenance/operator-types";
  let { controller }: { controller: MaintenanceController } = $props();
  const evidence = $derived(
    controller.reports.evidence ?? controller.snapshot?.coordinator,
  );
  const nodes = $derived(
    evidence?.report?.nodes.filter(
      (n) =>
        n.status !== "unchanged" &&
        (!controller.repositories.length ||
          controller.repositories.includes(n.repository)),
    ) ?? [],
  );
</script>

{#if evidence || controller.snapshot?.issues?.length}
  <details class="operations-attention">
    <summary
      >Automation attention · {nodes.length} operations · {controller.snapshot
        ?.issues?.length ?? 0} open issues</summary
    >
    <p>{evidence?.reason ?? "Coordinator report unavailable."}</p>
    {#each nodes as node}<p>
        <strong>{node.repository}</strong>: {attentionReason(node)} — {node.holds.join(
          " ",
        ) || node.acceptance.reason}
      </p>{/each}
    <Button
      variant="outline"
      size="sm"
      onclick={() => (controller.view = "operations")}
      >View waves, issues and decisions</Button
    >
  </details>
{/if}

<style>
  .operations-attention {
    margin: 0 0.75rem 0.75rem;
    padding: 0.6rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    font-size: 0.8rem;
  }
  p {
    margin-block: 0.4rem;
  }
</style>
