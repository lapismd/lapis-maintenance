<script lang="ts">
  import MaintenanceActionIcon from "../maintenance/MaintenanceActionIcon.svelte";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import * as Empty from "@lapismd/design-core/shadcn/empty";
  import {
    ShieldCheck,
    Workflow,
    ExternalLink,
    LockKeyhole,
  } from "@lucide/svelte";
  import ReviewResource from "./ReviewResource.svelte";
  import type { ReviewController } from "../../maintenance/review/controller.svelte";
  import "./review.css";
  let {
    controller,
    compact = false,
  }: { controller: ReviewController; compact?: boolean } = $props();
</script>

<section
  class="review-approvals"
  class:review-approvals-compact={compact}
  aria-label="Pending approvals"
>
  {#if !compact}<header class="review-section-heading">
      <ShieldCheck size={16} aria-hidden="true" />
      <h2>Pending approvals</h2>
      <Badge style="margin-inline-start:auto"
        >{controller.resources.approvals.data?.filter(
          (item) => item.state === "ready",
        ).length ?? 0}</Badge
      >
    </header>{/if}
  <ReviewResource
    resourceKey={controller.selectedId ?? "none"}
    state={controller.resources.approvals}
    label="Approvals"
    onRetry={() => controller.load("approvals", undefined, true)}
  >
    {#each controller.resources.approvals.data ?? [] as approval (approval.id)}
      {@const disabled =
        approval.state !== "ready" ||
        controller.pending ||
        controller.resources.approvals.loading ||
        controller.feedback?.result.status === "uncertain"}
      <article class="review-approval" data-state={approval.state}>
        <div class="review-approval-heading">
          {#if approval.kind === "workflow"}<Workflow
              size={16}
              aria-hidden="true"
            />{:else}<ShieldCheck size={16} aria-hidden="true" />{/if}
          <span class="review-eyebrow"
            >{approval.kind === "workflow"
              ? "Workflow approval"
              : "Environment review"}</span
          >
          <Badge variant="outline"
            >{approval.state === "ready"
              ? "Needs approval"
              : approval.state}</Badge
          >
        </div>
        <a
          class="review-approval-title"
          href={approval.url}
          target="_blank"
          rel="noopener noreferrer"
          >{approval.title}<ExternalLink size={12} aria-hidden="true" /></a
        >
        {#if !compact}
          <p class="review-muted">
            Run #{approval.runId} · attempt {approval.attempt} ·
            <code>{approval.sha.slice(0, 8)}</code>
          </p>
          {#if approval.environment}<Badge variant="secondary"
              >{approval.environment}</Badge
            >{/if}
          {#if approval.reviewers?.length}<p class="review-muted">
              Reviewers: {approval.reviewers.join(", ")}
            </p>{/if}
        {/if}
        <p class="review-approval-reason">{approval.reason}</p>
        {#if !compact}<span class="review-permission"
            ><LockKeyhole
              size={12}
              aria-hidden="true"
            />{approval.permission}</span
          >{/if}
        <div class="review-button-row">
          <Button
            size="sm"
            {disabled}
            onclick={() =>
              controller.invoke(
                approval.kind === "workflow"
                  ? "approve-workflow"
                  : "approve-environment",
                approval.id,
                approval.kind === "workflow"
                  ? "Approve workflow run"
                  : "Approve environment",
              )}
            ><MaintenanceActionIcon
              pending={controller.active?.targetId === approval.id &&
                ["approve-workflow", "approve-environment"].includes(
                  controller.active?.kind ?? "",
                )}
              kind={approval.kind === "workflow"
                ? "approve-workflow"
                : "approve-environment"}
            />{approval.kind === "workflow"
              ? "Approve workflow run"
              : "Approve environment"}</Button
          >
          {#if approval.kind === "environment"}<Button
              size="sm"
              variant="outline"
              {disabled}
              onclick={() =>
                controller.invoke(
                  "reject-environment",
                  approval.id,
                  "Reject environment",
                )}
              ><MaintenanceActionIcon
                kind="reject-environment"
                pending={controller.active?.targetId === approval.id &&
                  controller.active?.kind === "reject-environment"}
              />Reject</Button
            >{/if}
        </div>
      </article>
    {:else}
      {#if !compact}<Empty.Root
          ><Empty.Header
            ><Empty.Media variant="icon"><ShieldCheck /></Empty.Media
            ><Empty.Title>No approval waits</Empty.Title><Empty.Description
              >There are no pending workflow or environment reviews for this
              revision.</Empty.Description
            ></Empty.Header
          ></Empty.Root
        >{/if}
    {/each}
  </ReviewResource>
</section>
