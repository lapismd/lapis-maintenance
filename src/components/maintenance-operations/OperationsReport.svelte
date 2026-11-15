<script lang="ts">
  import {
    Rocket,
    GitBranch,
    GitCommitHorizontal,
    PackageCheck,
    CircleAlert,
  } from "@lucide/svelte";
  import type { WaveReport, WaveNode } from "../../maintenance/operator-types";
  import { attentionReason } from "../../maintenance/operator-types";
  import { RepositoryIdentifiers } from "@lapismd/repository-ui/jj";
  import { copyIdentifier } from "../../maintenance/copy-identifier";
  import OperationsNodeDetails from "./OperationsNodeDetails.svelte";
  import OperationsSection from "./OperationsSection.svelte";
  import OperationsSource from "./OperationsSource.svelte";
  import OperationsTimelineItem from "./OperationsTimelineItem.svelte";
  let {
    report,
    nodes,
    matches,
  }: {
    report: WaveReport;
    nodes: WaveNode[];
    matches: (repository: string, text?: string) => boolean;
  } = $props();
  const releases = $derived(
    report.releases.filter((r) => matches(r.repository, r.name)),
  );
  const decisions = $derived(
    report.operations.filter((o) =>
      matches(o.repository, `${o.status} ${o.reason}`),
    ),
  );
</script>

<OperationsSection
  title="Downstream progress and attention"
  count={nodes.length}
  icon={GitBranch}
>
  <ol class="operations-timeline">
    {#each nodes as node}<OperationsTimelineItem
        title={node.repository}
        summary={attentionReason(node)}
        status={node.status}
        icon={GitBranch}
      >
        <OperationsNodeDetails {node} policy={report.policyRevision} />
      </OperationsTimelineItem>{:else}<li class="operations-empty">
        No downstream operations in this view.
      </li>{/each}
  </ol>
</OperationsSection>
<OperationsSection title="Release waves" count={releases.length} icon={Rocket}>
  <ol class="operations-timeline">
    {#each releases as release}<OperationsTimelineItem
        title={release.name}
        summary={`${release.repository} · ${release.version ?? release.baseline}`}
        status={release.status}
        icon={Rocket}
      >
        <OperationsSource
          repository={release.repository}
          sha={release.sourceSha}
        />
        <p>
          Baseline {release.baseline}{#if release.version}
            · Version {release.version}{/if}
        </p>
        {#each release.requires as upstream}<p>
            Requires {upstream.name}
            {upstream.target} ({upstream.type})
          </p>{/each}
      </OperationsTimelineItem>{:else}<li class="operations-empty">
        No release intents in this report.
      </li>{/each}
  </ol>
</OperationsSection>
<OperationsSection
  title="Automation decisions"
  count={decisions.length}
  icon={GitCommitHorizontal}
>
  <ol class="operations-timeline">
    {#each decisions as operation}<OperationsTimelineItem
        title={operation.repository}
        summary={operation.reason}
        status={operation.status}
        icon={GitCommitHorizontal}
      >
        <OperationsSource
          repository={operation.repository}
          sha={operation.sourceSha}
        />
        <p>{operation.reason}</p>
        <p class="operations-muted">
          {operation.ownership} · {operation.acceptance}
        </p>
        {#each operation.targets as target}<p>
            {target.path} · {target.type} · {target.name}@{target.target}
          </p>{/each}
        <time datetime={operation.observedAt}>{operation.observedAt}</time>
        <RepositoryIdentifiers
          placement="inline"
          copyText={copyIdentifier}
          commitId={operation.id}
          changeId={operation.policyRevision}
          commitLabel="operation ID"
          changeLabel="policy revision"
          commitChipLabel="Operation"
          changeChipLabel="Policy"
        />
      </OperationsTimelineItem>{:else}<li class="operations-empty">
        No automation decisions in this view.
      </li>{/each}
  </ol>
</OperationsSection>
<OperationsSection
  title="Verified publications"
  count={report.publications.length}
  icon={PackageCheck}
>
  <ol class="operations-timeline">
    {#each report.publications as publication}<OperationsTimelineItem
        title={`${publication.name}@${publication.version}`}
        summary="Verified registry publication"
        status="published"
        icon={PackageCheck}
      >
        <p>Package integrity</p>
        <RepositoryIdentifiers
          placement="inline"
          copyText={copyIdentifier}
          commitId={publication.integrity}
          commitLabel="package integrity"
        />
      </OperationsTimelineItem>{:else}<li class="operations-empty">
        No verified publications in this report.
      </li>{/each}
  </ol>
</OperationsSection>
{#if report.coverage.length}<OperationsSection
    title="Coverage gaps"
    count={report.coverage.length}
    icon={CircleAlert}
  >
    <ol class="operations-timeline">
      {#each report.coverage as gap}<OperationsTimelineItem
          title={gap.opaqueId}
          summary="Source coverage is incomplete"
          status="unavailable"
          icon={CircleAlert}><p>{gap.reason}</p></OperationsTimelineItem
        >{/each}
    </ol>
  </OperationsSection>{/if}
