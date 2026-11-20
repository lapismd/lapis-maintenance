<script lang="ts">
  import {
    Rocket,
    GitBranch,
    GitCommitHorizontal,
    PackageCheck,
    CircleAlert,
  } from "@lucide/svelte";
  import type { WaveReport, WaveNode } from "../../maintenance/operator-types";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  import type { DispatchController } from "../../maintenance/dispatch/controller.svelte";
  import {
    currentReleaseIntent,
    currentRepositoryOperation,
  } from "../../maintenance/operations-current";
  import { attentionReason } from "../../maintenance/operator-types";
  import { primaryAttention } from "../../maintenance/attention";
  import { RelativeTime } from "@lapismd/design-core/shadcn/relative-time";
  import { RepositoryIdentifiers } from "@lapismd/repository-ui/jj";
  import { copyIdentifier } from "../../maintenance/copy-identifier";
  import OperationsNodeDetails from "./OperationsNodeDetails.svelte";
  import OperationsSection from "./OperationsSection.svelte";
  import OperationsSource from "./OperationsSource.svelte";
  import OperationsTimelineItem from "./OperationsTimelineItem.svelte";
  import OperationsStatus from "./OperationsStatus.svelte";
  import { repositoryDecisions } from "../../maintenance/operation-decisions";
  let {
    report,
    nodes,
    matches,
    controller,
    evidenceState,
    dispatch,
  }: {
    report: WaveReport;
    nodes: WaveNode[];
    matches: (repository: string, text?: string) => boolean;
    controller: MaintenanceController;
    evidenceState: string;
    dispatch?: DispatchController;
  } = $props();
  const scopedDecisions = $derived(
    new Set(
      report.nodes.filter((n) => n.scopedAdmission).map((n) => n.operationId),
    ),
  );
  const releases = $derived(
    report.releases.filter((r) => matches(r.repository, r.name)),
  );
  const decisions = $derived(
    repositoryDecisions(report.operations).filter(({ current: o }) =>
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
    {#each nodes as node}{@const attention =
        primaryAttention(node)}{@const current = currentRepositoryOperation(
        controller.snapshot,
        node,
      )}<OperationsTimelineItem
        title={node.repository}
        summary={attentionReason(node)}
        status={node.scopedAdmission ? `sdk-only-${node.status}` : node.status}
        secondaryStatus={`github-${current.actions.state}`}
        attentionCategory={attention?.category}
        icon={GitBranch}
      >
        <OperationsNodeDetails
          {node}
          policy={report.policyRevision}
          {current}
          {controller}
          {evidenceState}
          {dispatch}
        />
      </OperationsTimelineItem>{:else}<li class="operations-empty">
        No downstream operations in this view.
      </li>{/each}
  </ol>
</OperationsSection>
<OperationsSection
  title="Release intents and admission"
  count={releases.length}
  icon={Rocket}
>
  <ol class="operations-timeline">
    {#each releases as release}{@const current = currentReleaseIntent(
        report,
        release,
      )}<OperationsTimelineItem
        title={release.name}
        summary={current.summary}
        status={current.status}
        icon={Rocket}
      >
        <OperationsSource
          repository={release.repository}
          sha={release.sourceSha}
        />
        <p>
          Baseline {release.baseline}{#if release.version}
            · Version {release.version}{/if}
          {#if current.publishedVersion}
            · Verified publication {current.publishedVersion}{/if}
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
    {#each decisions as { current: operation, previous } (operation.repository.toLowerCase())}<OperationsTimelineItem
        title={operation.repository}
        summary={scopedDecisions.has(operation.id)
          ? `SDK-only · ${operation.reason}`
          : operation.reason}
        status={scopedDecisions.has(operation.id)
          ? `sdk-only-${operation.status}`
          : operation.status}
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
        <div class="operations-observed-at">
          <RelativeTime timestamp={operation.observedAt} />
        </div>
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
        {#if previous}<section
            class="operations-detail-section"
            aria-label="Previous decision"
          >
            <h4>Previous decision</h4>
            <div class="operations-detail-row">
              <OperationsStatus status={previous.status} />
              <RelativeTime timestamp={previous.observedAt} />
            </div>
            <p>{previous.reason}</p>
            <OperationsSource
              repository={previous.repository}
              sha={previous.sourceSha}
            />
            <RepositoryIdentifiers
              placement="inline"
              copyText={copyIdentifier}
              commitId={previous.id}
              changeId={previous.policyRevision}
              commitLabel="previous operation ID"
              changeLabel="previous policy revision"
              commitChipLabel="Operation"
              changeChipLabel="Policy"
            />
          </section>{/if}
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
