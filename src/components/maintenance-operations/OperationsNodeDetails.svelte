<script lang="ts">
  import { RepositoryIdentifiers } from "@lapismd/repository-ui/jj";
  import { copyIdentifier } from "../../maintenance/copy-identifier";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import {
    ArrowRight,
    GitBranch,
    CircleAlert,
    ExternalLink,
    Package,
  } from "@lucide/svelte";
  import type { WaveNode } from "../../maintenance/operator-types";
  import OperationsScopedDetails from "./OperationsScopedDetails.svelte";
  import OperationsSource from "./OperationsSource.svelte";
  import "./operations-details.css";
  let { node, policy }: { node: WaveNode; policy: string } = $props();
  const branchUrl = (repository: string, branch: string) =>
    `https://github.com/${repository}/tree/${branch
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`;
</script>

<dl class="operations-properties">
  <dt>Repository</dt>
  <dd>
    <OperationsSource repository={node.repository} sha={node.sourceSha} />
  </dd>
  <dt>{node.scopedAdmission ? "Source checks" : "Qualification"}</dt>
  <dd>{node.acceptance.reason}</dd>
  <dt>Ownership</dt>
  <dd>{node.ownership.reason}</dd>
  <dt>Updates</dt>
  <dd>
    {node.updates.length + (node.scopedAdmission?.deferredUpdates.length ?? 0)} discovered
    · {#if node.scopedAdmission}{node.updates.length} selected SDK ·
    {/if}{node.admittedUpdates?.length ?? "unavailable"} admitted
  </dd>
</dl>
{#if node.scopedAdmission}<OperationsScopedDetails
    scope={node.scopedAdmission}
    selected={node.updates.length}
  />{/if}
{#if node.attention?.length}<section
    class="operations-detail-section operations-attention-details"
    aria-label="What needs attention"
  >
    <h4><CircleAlert size={13} aria-hidden="true" />What needs attention</h4>
    <ul>
      {#each node.attention as item}<li>
          <div class="operations-detail-row">
            <strong>{item.summary}</strong><Badge variant="outline"
              >{item.category.replaceAll("-", " ")}</Badge
            >
          </div>
          {#if item.detail !== item.summary}<p>{item.detail}</p>{/if}
          <p class="operations-remediation">{item.remediation}</p>
          <div class="operations-attention-links">
            {#if item.repository}<OperationsSource
                repository={item.repository}
                sha={item.sourceSha}
              />{/if}
            {#if item.repository && item.branch}<a
                href={branchUrl(item.repository, item.branch)}
                target="_blank"
                rel="noopener noreferrer"
                ><GitBranch
                  size={13}
                  aria-hidden="true"
                />{item.branch}<ExternalLink size={12} aria-hidden="true" /></a
              >{/if}
            {#if item.package}<a
                href={`https://www.npmjs.com/package/${encodeURIComponent(item.package)}`}
                target="_blank"
                rel="noopener noreferrer"
                ><Package
                  size={13}
                  aria-hidden="true"
                />{item.package}<ExternalLink size={12} aria-hidden="true" /></a
              >{/if}
          </div>
        </li>{/each}
    </ul>
  </section>{:else if node.holds.length || node.branchHolds?.length}<section
    class="operations-detail-section"
  >
    <h4><CircleAlert size={13} aria-hidden="true" />Holds</h4>
    <ul>
      {#each node.holds as hold}<li>{hold}</li>{/each}
      {#each node.branchHolds ?? [] as hold}<li>
          <strong>{hold.branch}</strong> · {hold.family ?? "unclassified"}
          <p>{hold.reason}</p>
          <OperationsSource repository={node.repository} sha={hold.head} />
        </li>{/each}
    </ul>
  </section>{/if}
{#if !node.attention?.length && node.waits.length}<section
    class="operations-detail-section"
  >
    <h4><GitBranch size={13} aria-hidden="true" />Upstream dependencies</h4>
    <ul>
      {#each node.waits as wait}<li>
          <div class="operations-detail-row">
            <strong>{wait.package}</strong><OperationsSource
              repository={wait.repository}
            />
          </div>
          <p class="operations-muted">{wait.reason}</p>
        </li>{/each}
    </ul>
  </section>{/if}
{#if node.updates.length}<section class="operations-detail-section">
    <h4>Package changes</h4>
    <ul>
      {#each node.updates as update}<li class="operations-detail-row">
          <strong>{update.name}</strong><span class="operations-version-change"
            ><code>{update.current}</code><ArrowRight
              size={12}
              aria-hidden="true"
            /><code>{update.target}</code><Badge variant="outline"
              >{update.compatibility}</Badge
            ></span
          >
        </li>{/each}
    </ul>
  </section>{/if}
<RepositoryIdentifiers
  placement="inline"
  copyText={copyIdentifier}
  commitId={node.operationId}
  changeId={policy}
  commitLabel="operation ID"
  changeLabel="policy revision"
  commitChipLabel="Operation"
  changeChipLabel="Policy"
/>
