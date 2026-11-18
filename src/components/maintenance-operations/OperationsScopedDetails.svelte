<script lang="ts">
  import type { ScopedAdmission } from "../../maintenance/operator-types";
  import { RepositoryIdentifiers } from "@lapismd/repository-ui/jj";
  import { copyIdentifier } from "../../maintenance/copy-identifier";
  import OperationsSource from "./OperationsSource.svelte";
  let { scope, selected }: { scope: ScopedAdmission; selected: number } =
    $props();
</script>

<section class="operations-detail-section" aria-label="SDK-only scope">
  <h4>SDK-only tooling update</h4>
  <p>
    The status covers @lapismd/spec-validator only; other repository work
    remains deferred.
  </p>
  {#if !selected}<p>No SDK update is selected in this observation.</p>{/if}
  <h4>Deferred package changes ({scope.deferredUpdates.length})</h4>
  <ul>
    {#each scope.deferredUpdates as update}<li>
        <div class="operations-detail-row">
          <strong>{update.name}</strong><span
            ><code>{update.current}</code> → <code>{update.target}</code> · {update.compatibility}</span
          >
        </div>
        <p>{update.path} · {update.type}</p>
      </li>{:else}<li>None reported in this scoped observation.</li>{/each}
  </ul>
  <h4>Deferred holds ({scope.deferredHolds.length})</h4>
  <ul>
    {#each scope.deferredHolds as hold, i}<li>
        <strong>{hold}</strong>
        <p>
          {scope.deferredHoldFacts[i]?.path} · {scope.deferredHoldFacts[i]
            ?.type} · {scope.deferredHoldFacts[i]?.name} · {scope
            .deferredHoldFacts[i]?.range}
        </p>
      </li>{:else}<li>None reported in this scoped observation.</li>{/each}
  </ul>
  <h4>Deferred upstream waits ({scope.deferredWaits.length})</h4>
  <ul>
    {#each scope.deferredWaits as wait}<li>
        <div class="operations-detail-row">
          <strong>{wait.package}</strong><OperationsSource
            repository={wait.repository}
          />
        </div>
        <p>
          {#if wait.path}{wait.path} ·
          {/if}{wait.reason}
        </p>
      </li>{:else}<li>None reported in this scoped observation.</li>{/each}
  </ul>
  <RepositoryIdentifiers
    placement="inline"
    copyText={copyIdentifier}
    commitId={scope.grantSha256}
    changeId={scope.policySha256}
    commitLabel="scoped grant SHA256"
    changeLabel="scoped admission policy SHA256"
    commitChipLabel="Grant"
    changeChipLabel="Admission policy"
  />
  <RepositoryIdentifiers
    placement="inline"
    copyText={copyIdentifier}
    commitId={scope.descriptorSha256}
    commitLabel="source descriptor SHA256"
    commitChipLabel="Descriptor"
  />
</section>
