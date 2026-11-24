<script lang="ts">
  import { Bot } from "@lucide/svelte";
  import type { AutocraftEvidence } from "../../maintenance/autocraft-types";
  import OperationsSection from "./OperationsSection.svelte";
  import OperationsTimelineItem from "./OperationsTimelineItem.svelte";
  import OperationsStatus from "./OperationsStatus.svelte";
  import OperationsSource from "./OperationsSource.svelte";
  let {
    evidence,
    loading = false,
    repositories = [],
    query = "",
  }: {
    evidence?: AutocraftEvidence | null;
    loading?: boolean;
    repositories?: string[];
    query?: string;
  } = $props();
  const report = $derived(evidence?.report);
  const rows = $derived(
    (report?.rows ?? []).filter(
      (row) =>
        (!repositories.length || repositories.includes(row.repository)) &&
        `${row.repository} #${row.number} ${row.state} ${row.reason}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    ),
  );
</script>

<OperationsSection
  title="AutoCraft agent queue"
  count={rows.length || undefined}
  icon={Bot}
>
  <div role="status">
    <OperationsStatus
      status={loading ? "refreshing" : (evidence?.state ?? "unavailable")}
    />
  </div>
  <p class="operations-muted">
    {evidence?.reason ??
      "AutoCraft report has not been loaded. Manual controls remain available."}
  </p>
  {#if report}
    <p>
      Worker {report.worker.enabled ? "enabled" : "disabled"} · {report.worker
        .healthy
        ? "healthy"
        : "unhealthy"} · {report.worker.phase} · {report.worker.actor}
    </p>
    <p class="operations-muted">
      Observed {new Date(report.observedAt).toLocaleString()} · Dependency evidence:
      {report.dependency.state}
    </p>
    <p>{report.dependency.reason}</p>
    <OperationsSource
      repository="lapismd/lapis-autocraft"
      sha={report.sourceRevision}
    />
    {#if evidence?.sourceRevision}<a
        class="operations-inline-link"
        href={`https://github.com/lapismd/lapis-autocraft/blob/${evidence.sourceRevision}/report.json`}
        target="_blank"
        rel="noopener noreferrer">Immutable queue report</a
      >{/if}
    <details>
      <summary>Operations policy digest</summary><code
        >{report.policyDigest}</code
      >
    </details>
    {#if !report.coverage.complete}<p>
        Partial queue coverage: {report.coverage.shown} of {report.coverage
          .total} PR rows; {report.coverage.deploymentsShown} of {report
          .coverage.deploymentsTotal} environment waits.
      </p>{/if}
    <ol class="operations-timeline">
      {#each rows as row (row.repository + "/" + row.number)}
        <OperationsTimelineItem
          title={`${row.repository} #${row.number}`}
          summary={row.reason}
          status={row.state}
          icon={Bot}
        >
          <a
            class="operations-inline-link"
            href={row.url}
            target="_blank"
            rel="noopener noreferrer">Open pull request #{row.number}</a
          >
          <OperationsSource repository={row.repository} sha={row.head} />
          {#if row.base}<p>Observed base</p>
            <OperationsSource repository={row.repository} sha={row.base} />{/if}
          {#if row.receipt}
            <p>
              Latest receipt: {row.receipt.action} · {row.receipt.outcome ??
                "running"} · {row.receipt.actor ?? "legacy identity"}{row
                .receipt.actorId
                ? ` (${row.receipt.actorId})`
                : ""}
            </p>
            <OperationsSource
              repository={row.repository}
              sha={row.receipt.head}
            />
            <p>
              {new Date(row.receipt.started).toLocaleString()} · {row.receipt
                .finished
                ? new Date(row.receipt.finished).toLocaleString()
                : "unfinished"}
            </p>
            <p>{row.receipt.evidence}</p>
          {/if}
          {#if row.rollout}
            <p>
              Post-merge CI: {row.rollout.state}. External deployment health
              remains separate.
            </p>
            {#if row.rollout.head}<OperationsSource
                repository={row.repository}
                sha={row.rollout.head}
              />{/if}
            {#each row.rollout.urls as url}<a
                class="operations-inline-link"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                >Post-merge workflow {url.split("/").at(-1)}</a
              >{/each}
          {/if}
        </OperationsTimelineItem>
      {:else}<li class="operations-empty">
          No AutoCraft PR rows match this scope.
        </li>{/each}
    </ol>
    {#if report.deployments.length}<p>
        Environment waits are evidence only. Use the existing live GitHub
        approval controls.
      </p>
      <ul>
        {#each report.deployments as wait}<li>
            <a
              href={`https://github.com/${wait.repository}/actions/runs/${wait.run}`}
              target="_blank"
              rel="noopener noreferrer"
              >{wait.repository} · {wait.environment} · run {wait.run}</a
            >
          </li>{/each}
      </ul>
    {/if}
  {/if}
</OperationsSection>
