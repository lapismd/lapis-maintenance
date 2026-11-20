<script lang="ts">
  import "./operations-content.css";
  import { useOperationsDisclosure } from "./disclosure.svelte";
  import * as Collapsible from "@lapismd/design-core/shadcn/collapsible";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import {
    Database,
    Clock3,
    ChevronRight,
    ChevronDown,
    ExternalLink,
  } from "@lucide/svelte";
  import type { CoordinatorEvidence } from "../../maintenance/operator-types";
  import { RepositoryIdentifiers } from "@lapismd/repository-ui/jj";
  import { copyIdentifier } from "../../maintenance/copy-identifier";
  import OperationsSource from "./OperationsSource.svelte";
  import "./operations-evidence.css";
  let {
    evidence,
    liveFetchedAt,
    liveState = "idle",
  }: {
    evidence?: CoordinatorEvidence | null;
    liveFetchedAt?: string;
    liveState?: string;
  } = $props();
  const disclosure = useOperationsDisclosure(() => false);
  const report = $derived(evidence?.report);
  const reason = $derived(
    evidence?.reason ??
      "Coordinator evidence is unavailable; individual GitHub controls remain available.",
  );
  const time = $derived(
    report
      ? new Date(report.observedAt).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "UTC",
        }) + " UTC"
      : "",
  );
  const liveStatus = $derived(
    !liveFetchedAt
      ? "Unavailable"
      : liveState === "error"
        ? "Refresh failed; retained observation"
        : ["loading", "refreshing"].includes(liveState)
          ? "Refreshing; previous observation"
          : "Latest successful observation",
  );
</script>

<Collapsible.Root bind:open={disclosure.open} class="operations-evidence">
  <Collapsible.Trigger
    >{#snippet child({ props })}<Button
        {...props}
        variant="ghost"
        class="operations-evidence-toggle"
      >
        <span class="operations-evidence-icon"
          ><Database aria-hidden="true" /></span
        ><span class="operations-evidence-reason" title={reason}>{reason}</span>
        {#if report}<span class="operations-evidence-time"
            ><Clock3 size={12} aria-hidden="true" /><time
              datetime={report.observedAt}>{time}</time
            ></span
          >{/if}
        {#if disclosure.open}<ChevronDown
            aria-hidden="true"
          />{:else}<ChevronRight aria-hidden="true" />{/if}
      </Button>{/snippet}</Collapsible.Trigger
  >
  <Collapsible.Content
    ><div class="operations-evidence-details">
      <p role="status">{reason}</p>
      {#if evidence?.url}<a
          class="operations-inline-link"
          href={evidence.url}
          target="_blank"
          rel="noopener noreferrer"
          ><ExternalLink size={14} aria-hidden="true" />Coordinator report
          source</a
        >{/if}
      {#if report || liveFetchedAt}<dl class="operations-properties">
          {#if report}<dt>Coordinator observed</dt>
            <dd>
              <time datetime={report.observedAt}>{report.observedAt}</time>
            </dd>
            <dt>Generation</dt>
            <dd>{report.generation}</dd>{/if}
          <dt>Live GitHub status</dt>
          <dd>{liveStatus}</dd>
          <dt>Live GitHub refreshed</dt>
          <dd>
            {#if liveFetchedAt}<time datetime={liveFetchedAt}
                >{liveFetchedAt}</time
              >{:else}Unavailable{/if}
          </dd>
        </dl>{/if}
      {#if report}
        <RepositoryIdentifiers
          placement="inline"
          copyText={copyIdentifier}
          commitId={report.reportId}
          changeId={report.policyRevision}
          commitLabel="report ID"
          changeLabel="policy revision"
          commitChipLabel="Report"
          changeChipLabel="Policy"
        />{/if}
      {#if evidence?.sourceRevision}<OperationsSource
          repository="lapismd/dependency-automation"
          sha={evidence.sourceRevision}
        />{/if}
    </div></Collapsible.Content
  >
</Collapsible.Root>
