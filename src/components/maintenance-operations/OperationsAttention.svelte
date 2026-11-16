<script lang="ts">
  import "./operations-content.css";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import * as Collapsible from "@lapismd/design-core/shadcn/collapsible";
  import {
    CircleAlert,
    ArrowRight,
    ChevronDown,
    ChevronRight,
  } from "@lucide/svelte";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  import { attentionReason } from "../../maintenance/operator-types";
  import { operationsScope } from "../../maintenance/operations";
  import OperationsSource from "./OperationsSource.svelte";
  import OperationsStatus from "./OperationsStatus.svelte";
  import "./operations-attention.css";
  let { controller }: { controller: MaintenanceController } = $props();
  let open = $state(false);
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
  <Collapsible.Root bind:open class="operations-attention">
    <div class="operations-attention-heading">
      <Collapsible.Trigger
        >{#snippet child({ props })}<Button
            {...props}
            variant="ghost"
            size="sm"
            aria-label="Toggle automation attention"
          >
            <CircleAlert aria-hidden="true" /><span>Automation attention</span>
            {#if open}<ChevronDown aria-hidden="true" />{:else}<ChevronRight
                aria-hidden="true"
              />{/if}
          </Button>{/snippet}</Collapsible.Trigger
      >
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
        onclick={() => (controller.view = "operations")}
        ><span>View waves, issues and decisions</span><ArrowRight
          aria-hidden="true"
        /></Button
      >
    </div>
    <Collapsible.Content
      ><div class="operations-attention-content">
        <p class="operations-muted">
          {evidence?.reason ?? "Coordinator report unavailable."}
        </p>
        <ol class="operations-timeline">
          {#each scope.attention as node}<li>
              <span class="operations-timeline-marker"
                ><CircleAlert size={14} aria-hidden="true" /></span
              >
              <article>
                <div class="operations-entry-heading">
                  <strong>{attentionReason(node)}</strong><OperationsStatus
                    status={node.status}
                  />
                </div>
                <OperationsSource
                  repository={node.repository}
                  sha={node.sourceSha}
                />
                <p>{node.holds.join(" ") || node.acceptance.reason}</p>
              </article>
            </li>{/each}
        </ol>
      </div></Collapsible.Content
    >
  </Collapsible.Root>
{/if}
