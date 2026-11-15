<script lang="ts">
  import { onMount } from "svelte";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  import { attentionReason } from "../../maintenance/operator-types";
  import BatchConfirmation from "./BatchConfirmation.svelte";
  import "./operations.css";
  let {
    controller,
    sessionMode = "demo",
  }: { controller: MaintenanceController; sessionMode?: "demo" | "github" } =
    $props();
  const evidence = $derived(
    controller.reports.evidence ?? controller.snapshot?.coordinator,
  );
  onMount(() => {
    void controller.reports.refresh();
  });
  const report = $derived(evidence?.report);
  const matches = (repository: string, text = "") =>
    (!controller.repositories.length ||
      controller.repositories.includes(repository)) &&
    (!controller.query ||
      `${repository} ${text}`
        .toLowerCase()
        .includes(controller.query.toLowerCase()));
  const nodes = $derived(
    report?.nodes.filter((n) =>
      matches(
        n.repository,
        `${n.status} ${attentionReason(n)} ${n.holds.join(" ")}`,
      ),
    ) ?? [],
  );
  const issues = $derived(
    controller.snapshot?.issues?.filter((i) =>
      matches(i.repository, i.title),
    ) ?? [],
  );
  const actions = [
    { kind: "rerun-failed" as const, label: "Rerun eligible failures" },
    { kind: "approve-run" as const, label: "Approve eligible workflows" },
    {
      kind: "approve-deployment" as const,
      label: "Approve eligible environments",
    },
  ];
</script>

<section class="maintenance-operations" aria-label="Maintenance operations">
  <header>
    <h2>Dependency and release operations</h2>
    <Badge variant="outline"
      >{controller.reports.loading
        ? "refreshing"
        : (evidence?.state ?? "unavailable")}</Badge
    >
  </header>
  <p role="status">
    {evidence?.reason ??
      "Coordinator evidence is unavailable. Refresh to load reports; individual GitHub controls remain available."}
  </p>
  {#if evidence?.url}<a
      href={evidence.url}
      target="_blank"
      rel="noopener noreferrer">Coordinator report source</a
    >{/if}
  {#if report}
    <p class="maintenance-muted">
      Observed {report.observedAt} · Generation {report.generation}
    </p>
    <details>
      <summary>Report and policy identity</summary>
      <dl>
        <dt>Report source commit</dt>
        <dd><code>{evidence?.sourceRevision ?? "Fixture evidence"}</code></dd>
        <dt>Report</dt>
        <dd><code>{report.reportId}</code></dd>
        <dt>Policy revision</dt>
        <dd><code>{report.policyRevision}</code></dd>
      </dl>
    </details>
    {#if report.coverage.length}<section aria-label="Coordinator coverage gaps">
        <h3>Coverage gaps</h3>
        {#each report.coverage as gap}<p>{gap.opaqueId}: {gap.reason}</p>{/each}
      </section>{/if}
    <section aria-label="Release waves">
      <h3>Release waves</h3>
      {#each report.releases.filter( (r) => matches(r.repository, r.name), ) as release}<article
        >
          <h4>
            {release.name}
            <Badge variant="outline">{release.status}</Badge>
          </h4>
          <p>{release.repository} · {release.version ?? release.baseline}</p>
          <p>Source <code>{release.sourceSha}</code></p>
          {#each release.requires as upstream}<p>
              Requires {upstream.name}
              {upstream.target} ({upstream.type})
            </p>{/each}
        </article>{:else}<p>No release intents in this report.</p>{/each}
    </section>
    <section aria-label="Downstream progress">
      <h3>Downstream progress and attention</h3>
      {#each nodes as node}<article>
          <h4>
            {node.repository}
            <Badge variant="outline">{node.status}</Badge>
          </h4>
          <p>{attentionReason(node)}</p>
          <p>{node.acceptance.reason} · {node.ownership.reason}</p>
          <p>
            Discovered updates: {node.updates.length} · Coordinator admitted candidates:
            {node.admittedUpdates?.length ?? "unavailable"}
          </p>
          {#each node.branchHolds ?? [] as hold}<p>
              Branch hold: {hold.branch} · {hold.family ?? "unclassified"}: {hold.reason}
              · <code>{hold.head}</code>
            </p>{/each}
          {#each node.holds as hold}<p>Hold: {hold}</p>{/each}
          {#each node.waits as wait}<p>
              Upstream: {wait.repository} · {wait.package}: {wait.reason}
            </p>{/each}
          {#each node.updates as update}<p>
              {update.name}: {update.current} → {update.target} ({update.compatibility})
            </p>{/each}
          <details>
            <summary>Decision target</summary>
            <p>Operation <code>{node.operationId}</code></p>
            <p>Source <code>{node.sourceSha}</code></p>
            <p>Policy <code>{report.policyRevision}</code></p>
          </details>
        </article>{:else}<p>No downstream operations in this view.</p>{/each}
    </section>
    <details>
      <summary>Automation decisions ({report.operations.length})</summary
      >{#each report.operations.filter( (o) => matches(o.repository), ) as operation}<article
        >
          <h4>{operation.repository}: {operation.status}</h4>
          <p>{operation.reason}</p>
          <p>{operation.ownership} · {operation.acceptance}</p>
          {#each operation.targets as target}<p>
              {target.path} · {target.type} · {target.name}@{target.target}
            </p>{/each}
          <p>{operation.observedAt}</p>
          <p>Operation <code>{operation.id}</code></p>
          <p>Source <code>{operation.sourceSha}</code></p>
          <p>Policy <code>{operation.policyRevision}</code></p>
        </article>{/each}
    </details>
    <details>
      <summary>Verified publications ({report.publications.length})</summary
      >{#each report.publications as publication}<p>
          {publication.name}@{publication.version}
          <code>{publication.integrity}</code>
        </p>{/each}
    </details>
  {/if}
  <section aria-label="Open GitHub issues">
    <h3>Open GitHub issues ({issues.length})</h3>
    {#each issues as issue}<article>
        <a href={issue.url} target="_blank" rel="noopener noreferrer"
          >{issue.repository} #{issue.number}: {issue.title}</a
        ><Badge variant="outline">{issue.category}</Badge
        >{#if issue.category === "compatibility"}<p>
            Compatibility project: deliberate review required.
          </p>{/if}
      </article>{:else}<p>No open issues in the available coverage.</p>{/each}
    {#each controller.unavailable as gap}<p>
        {gap.repository}: {gap.reason}
      </p>{/each}
  </section>
  <section aria-label="Confirmed batch actions">
    <h3>Batch actions</h3>
    <p>
      Only individually eligible targets in the current filtered inbox enter
      confirmation. Each target is revalidated immediately before writing.
    </p>
    <div class="operations-actions">
      {#each actions as action}<Button
          variant="outline"
          size="sm"
          disabled={controller.commands.busy ||
            !controller.items.some(
              (i) =>
                i.actions.some((a) => a.kind === action.kind && a.available) &&
                !controller.commands.blocked(i, action.kind),
            )}
          onclick={() =>
            controller.commands.prepareBatch(controller.items, action.kind)}
          >{action.label}</Button
        >{/each}
    </div>
    {#if controller.commands.busy}<p role="status">
        Submitting confirmed targets…
      </p>{/if}
    <ol aria-label="Action outcomes">
      {#each controller.commands.receipts as receipt}<li>
          {receipt.command.repository} · {receipt.command.kind} · {receipt.command.target.sha.slice(
            0,
            8,
          )}: <strong>{receipt.status}</strong> — {receipt.message}
        </li>{/each}
    </ol>
  </section>
</section>
<BatchConfirmation {controller} {sessionMode} />
