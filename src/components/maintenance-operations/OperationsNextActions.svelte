<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { ExternalLink, Play, RefreshCw } from "@lucide/svelte";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  import type { DispatchController } from "../../maintenance/dispatch/controller.svelte";
  import type { CurrentRepositoryOperation } from "../../maintenance/operations-current";
  import type { ActionKind, View } from "../../maintenance/types";
  import type { WaveNode } from "../../maintenance/operator-types";
  import { primaryAttention } from "../../maintenance/attention";
  import MaintenanceActionIcon from "../maintenance/MaintenanceActionIcon.svelte";

  let {
    controller,
    current,
    node,
    policy,
    evidenceState,
    dispatch,
  }: {
    controller: MaintenanceController;
    current: CurrentRepositoryOperation;
    node: WaveNode;
    policy: string;
    evidenceState: string;
    dispatch?: DispatchController;
  } = $props();

  const item = $derived(current.currentItem);
  const directKinds = new Set<ActionKind>([
    "approve-run",
    "approve-deployment",
    "rerun-failed",
  ]);
  const directActions = $derived(
    item?.actions.filter(
      (action) => action.available && directKinds.has(action.kind),
    ) ?? [],
  );
  const category = $derived(primaryAttention(node)?.category);
  const attention = $derived(primaryAttention(node));
  const actionRepository = $derived(attention?.repository ?? node.repository);
  const coordinatorAction = $derived(
    !!dispatch &&
      evidenceState === "current" &&
      ["branch-reconciliation", "rollout"].includes(category ?? ""),
  );
  const repositoryAction = $derived(
    !!dispatch &&
      evidenceState === "current" &&
      ["publication", "qualification"].includes(category ?? "") &&
      !["channel-admission", "publisher-policy"].includes(
        attention?.code ?? "",
      ),
  );
  function show(view: View) {
    controller.repositories = [node.repository];
    controller.view = view;
  }
  const itemView = $derived<View>(
    item?.kind === "approval"
      ? "approval"
      : item?.kind === "pull-request"
        ? "pull-request"
        : "workflow",
  );
</script>

<section class="operations-detail-section operations-next-actions">
  <h4>Next actions</h4>
  <div class="operations-next-action-row">
    <Button
      variant="outline"
      size="sm"
      disabled={controller.phase === "loading" ||
        controller.phase === "refreshing" ||
        controller.reports.loading}
      onclick={() => controller.refresh(true)}
      aria-label={`${node.repository}: refresh current state`}
      ><RefreshCw aria-hidden="true" />Refresh current state</Button
    >
    {#if item}<a
        class="operations-inline-link"
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${node.repository}: open ${item.title}`}
        ><ExternalLink aria-hidden="true" />Open live work: {item.title}</a
      ><Button
        variant="outline"
        size="sm"
        aria-label={`${node.repository}: view ${itemView.replaceAll("-", " ")}`}
        onclick={() => show(itemView)}
        >View {itemView.replaceAll("-", " ")}</Button
      >{/if}
    {#each directActions as action}<Button
        variant="outline"
        size="sm"
        disabled={controller.commands.busy ||
          !item ||
          controller.commands.blocked(item, action.kind)}
        onclick={() => item && controller.commands.invoke(item, action.kind)}
        aria-label={`${node.repository}: ${action.label}`}
        ><MaintenanceActionIcon
          kind={action.kind}
          pending={controller.commands.active?.itemId === item?.id &&
            controller.commands.active?.kind === action.kind}
        />{action.label}</Button
      >{/each}
    {#if coordinatorAction}<Button
        variant="outline"
        size="sm"
        aria-label={`${node.repository}: run coordinator workflow`}
        onclick={() => dispatch?.show("lapismd/dependency-automation")}
        ><Play aria-hidden="true" />Run coordinator workflow</Button
      >{/if}
    {#if repositoryAction}<Button
        variant="outline"
        size="sm"
        aria-label={`${node.repository}: run ${actionRepository} workflow`}
        onclick={() => dispatch?.show(actionRepository)}
        ><Play aria-hidden="true" />Run {actionRepository === node.repository
          ? "repository"
          : "upstream"} workflow</Button
      >{/if}
    {#if attention?.code === "channel-admission"}<a
        class="operations-inline-link"
        href={`https://github.com/lapismd/dependency-automation/blob/${policy}/config/channels.json`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${node.repository}: review exact channel policy`}
        ><ExternalLink aria-hidden="true" />Review channel policy</a
      >{:else if attention?.code === "publisher-policy"}<a
        class="operations-inline-link"
        href={`https://github.com/lapismd/dependency-automation/blob/${policy}/config/publications.json`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${node.repository}: review publisher policy`}
        ><ExternalLink aria-hidden="true" />Review publisher policy</a
      >{:else if category === "product-constraint"}<a
        class="operations-inline-link"
        href={current.issue?.url ??
          `https://github.com/${node.repository}/issues?q=is%3Aissue+is%3Aopen`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${node.repository}: open qualification work`}
        ><ExternalLink aria-hidden="true" />{current.issue
          ? `Open qualification issue: ${current.issue.title}`
          : "Open qualification issues"}</a
      >{/if}
  </div>
  {#if category === "policy-exclusion"}<p class="operations-muted">
      This repository is intentionally excluded. A reviewed policy change is
      required before automation can act.
    </p>{:else if category === "product-constraint"}<p class="operations-muted">
      Product qualification owns this hold; coordinator replay cannot waive it.
    </p>{:else if !item && !coordinatorAction && !repositoryAction}<p
      class="operations-muted"
    >
      No safe automated action is currently available. Use the remediation and
      source links above.
    </p>{/if}
</section>

<style>
  .operations-next-action-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.45rem;
  }
  .operations-next-action-row :global(a) {
    min-height: 2rem;
  }
</style>
