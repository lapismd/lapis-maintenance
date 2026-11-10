<script lang="ts">
  import { RepositoryForgePanel } from "@lapismd/repository-ui/jj";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import { Workflow, ShieldCheck } from "@lucide/svelte";
  import MaintenanceChecks from "./MaintenanceChecks.svelte";
  import {
    statusLabels,
    type MaintenanceDetail,
  } from "../../maintenance/types";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  let {
    detail,
    controller,
    onClose,
  }: {
    detail: MaintenanceDetail;
    controller: MaintenanceController;
    onClose: () => void;
  } = $props();
</script>

<RepositoryForgePanel
  title={detail.item.title}
  label={detail.item.kind === "approval" ? "Deployment" : "Workflow"}
  ariaLabel={`${detail.item.kind === "approval" ? "Deployment" : "Workflow"} details`}
  {onClose}
>
  {#snippet leading()}{#if detail.item.kind === "approval"}<ShieldCheck
        size={16}
        aria-hidden="true"
      />{:else}<Workflow size={16} aria-hidden="true" />{/if}{/snippet}
  {#snippet context()}<Badge variant="secondary"
      >{statusLabels[detail.item.status]}</Badge
    >{/snippet}
  <div class="maintenance-run-context">
    <p>{detail.description}</p>
    {#if detail.review}<p>{detail.review}</p>{/if}
    <dl class="maintenance-facts">
      <div>
        <dt>Revision</dt>
        <dd><code>{detail.item.target.sha.slice(0, 8)}</code></dd>
      </div>
      {#if detail.workflow}<div>
          <dt>Workflow</dt>
          <dd>{detail.workflow}</dd>
        </div>{/if}
      {#if detail.environment}<div>
          <dt>Environment</dt>
          <dd>{detail.environment}</dd>
        </div>{/if}
      {#if detail.ref}<div>
          <dt>Reference</dt>
          <dd>{detail.ref}</dd>
        </div>{/if}
    </dl>
  </div>
  <MaintenanceChecks {detail} {controller} />
</RepositoryForgePanel>

<style>
  .maintenance-run-context {
    padding: 0.75rem;
    display: grid;
    gap: 0.75rem;
    font-size: 0.8125rem;
  }
</style>
