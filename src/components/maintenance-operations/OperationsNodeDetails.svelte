<script lang="ts">
  import { RepositoryIdentifiers } from "@lapismd/repository-ui/jj";
  import { copyIdentifier } from "../../maintenance/copy-identifier";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import { ArrowRight, GitBranch, CircleAlert } from "@lucide/svelte";
  import type { WaveNode } from "../../maintenance/operator-types";
  import OperationsSource from "./OperationsSource.svelte";
  import "./operations-details.css";
  let { node, policy }: { node: WaveNode; policy: string } = $props();
</script>

<dl class="operations-properties">
  <dt>Repository</dt>
  <dd>
    <OperationsSource repository={node.repository} sha={node.sourceSha} />
  </dd>
  <dt>Qualification</dt>
  <dd>{node.acceptance.reason}</dd>
  <dt>Ownership</dt>
  <dd>{node.ownership.reason}</dd>
  <dt>Updates</dt>
  <dd>
    {node.updates.length} discovered · {node.admittedUpdates?.length ??
      "unavailable"} admitted
  </dd>
</dl>
{#if node.holds.length || node.branchHolds?.length}<section
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
{#if node.waits.length}<section class="operations-detail-section">
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
