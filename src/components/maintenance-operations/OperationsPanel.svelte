<script lang="ts">
  import "./operations-content.css";
  import { ScrollArea } from "@lapismd/design-core/shadcn/scroll-area";
  import { onMount, setContext } from "svelte";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  import { operationsScope } from "../../maintenance/operations";
  import {
    Workflow,
    CircleDot,
    ExternalLink,
    FoldVertical,
    UnfoldVertical,
  } from "@lucide/svelte";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import {
    OperationsDisclosures,
    operationsDisclosureKey,
  } from "./disclosure.svelte";
  import OperationsTimelineItem from "./OperationsTimelineItem.svelte";
  import OperationsFooter from "./OperationsFooter.svelte";
  import OperationsSection from "./OperationsSection.svelte";
  import OperationsReport from "./OperationsReport.svelte";
  import OperationsSource from "./OperationsSource.svelte";
  import OperationsEvidence from "./OperationsEvidence.svelte";
  import OperationsStatus from "./OperationsStatus.svelte";
  import "./operations.css";
  let {
    controller,
    sessionMode = "demo",
  }: { controller: MaintenanceController; sessionMode?: "demo" | "github" } =
    $props();
  const disclosures = new OperationsDisclosures();
  setContext(operationsDisclosureKey, disclosures);
  const evidence = $derived(
    controller.reports.evidence ?? controller.snapshot?.coordinator,
  );
  onMount(() => {
    if (!controller.reports.loading) void controller.reports.refresh();
  });
  const report = $derived(evidence?.report);
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

<div class="operations-page">
  <ScrollArea
    class="operations-scroll"
    viewportProps={{
      class: "operations-scroll-viewport",
      role: "region",
      "aria-label": "Operations timeline",
    }}
  >
    <section class="maintenance-operations" aria-label="Maintenance operations">
      <header class="operations-page-heading">
        <span class="operations-page-icon"
          ><Workflow size={16} aria-hidden="true" /></span
        >
        <div>
          <h2>Dependency and release operations</h2>
        </div>
        <OperationsStatus
          status={controller.reports.loading
            ? "refreshing"
            : (evidence?.state ?? "unavailable")}
        />
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={disclosures.anyOpen
            ? "Fold all operations"
            : "Expand all operations"}
          title={disclosures.anyOpen ? "Fold all" : "Expand all"}
          onclick={() => disclosures.toggleAll()}
        >
          {#if disclosures.anyOpen}<FoldVertical
              aria-hidden="true"
            />{:else}<UnfoldVertical aria-hidden="true" />{/if}
        </Button>
      </header>
      <OperationsEvidence {evidence} />
      {#if report}<OperationsReport
          {report}
          nodes={scope.nodes}
          matches={scope.matches}
        />{/if}
      <OperationsSection
        title="Open GitHub issues"
        count={scope.issues.length}
        icon={CircleDot}
      >
        <ol class="operations-timeline">
          {#each scope.issues as issue}<OperationsTimelineItem
              title={issue.title}
              summary={`${issue.repository} · #${issue.number}`}
              status={issue.category}
              icon={CircleDot}
            >
              <a
                class="operations-inline-link"
                href={issue.url}
                target="_blank"
                rel="noopener noreferrer"
                ><ExternalLink size={14} aria-hidden="true" />{issue.title} #{issue.number}</a
              >
              <OperationsSource repository={issue.repository} />
              {#if issue.category === "compatibility"}<p
                  class="operations-muted"
                >
                  Compatibility project: deliberate review required.
                </p>{/if}
            </OperationsTimelineItem>{:else}<li class="operations-empty">
              No open issues in the available coverage.
            </li>{/each}
        </ol>
      </OperationsSection>
    </section>
  </ScrollArea>

  <OperationsFooter {controller} {sessionMode} />
</div>
