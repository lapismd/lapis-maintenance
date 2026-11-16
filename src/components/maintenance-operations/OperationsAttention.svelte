<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import { CircleAlert, ArrowRight } from "@lucide/svelte";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  import { operationsScope } from "../../maintenance/operations";
  import "./operations-attention.css";
  let { controller }: { controller: MaintenanceController } = $props();
  const evidence = $derived(
    controller.reports.evidence ?? controller.snapshot?.coordinator,
  );
  const scope = $derived(
    operationsScope(
      controller.snapshot,
      evidence,
      controller.repositories,
      controller.repositoryStatuses,
      controller.query,
    ),
  );
</script>

{#if evidence || scope.issues.length}
  <div
    class="operations-attention"
    role="region"
    aria-label="Automation attention"
  >
    <div class="operations-attention-heading">
      <span class="operations-attention-title">
        <CircleAlert size={16} aria-hidden="true" /><span
          >Automation attention</span
        >
      </span>
      <Badge
        aria-label={`${scope.attention.length + scope.issues.length} items need attention`}
        variant="secondary"
        >{scope.attention.length + scope.issues.length}</Badge
      >
      <span class="operations-attention-counts"
        >{scope.attention.length} operations · {scope.issues.length} open issues</span
      >
      <Button
        variant="ghost"
        size="sm"
        aria-label="View waves, issues and decisions"
        title="View waves, issues and decisions"
        onclick={() => (controller.view = "operations")}
        ><span>View waves, issues and decisions</span><ArrowRight
          data-icon="inline-end"
          aria-hidden="true"
        /></Button
      >
    </div>
  </div>
{/if}
