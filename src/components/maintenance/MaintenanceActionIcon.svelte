<script lang="ts">
  import {
    GitPullRequestArrow,
    GitPullRequestDraft,
    GitMerge,
    GitPullRequest,
    GitPullRequestClosed,
    MessageSquare,
    RotateCcw,
    CircleX,
    ShieldCheck,
    ShieldX,
    Play,
    LoaderCircle,
  } from "@lucide/svelte";
  import type { ActionKind } from "../../maintenance/types";
  let {
    kind,
    pending = false,
  }: {
    pending?: boolean;
    kind:
      | ActionKind
      | "approve-workflow"
      | "approve-environment"
      | "reject-environment";
  } = $props();
  const icons = {
    "mark-ready": GitPullRequestDraft,
    "approve-pr": GitPullRequestArrow,
    "request-changes": GitPullRequestClosed,
    comment: MessageSquare,
    "merge-pr": GitMerge,
    "enable-auto-merge": GitPullRequest,
    "disable-auto-merge": CircleX,
    "rerun-failed": RotateCcw,
    "cancel-run": CircleX,
    "approve-run": ShieldCheck,
    "approve-deployment": ShieldCheck,
    "reject-deployment": ShieldX,
    "dispatch-workflow": Play,
    "approve-workflow": ShieldCheck,
    "approve-environment": ShieldCheck,
    "reject-environment": ShieldX,
  };
  const Icon = $derived(icons[kind]);
</script>

{#if pending}<LoaderCircle
    aria-hidden="true"
    data-icon="inline-start"
    class="maintenance-action-spinner"
  />{:else}<Icon size={15} aria-hidden="true" data-icon="inline-start" />{/if}

<style>
  :global(.maintenance-action-spinner) {
    animation: maintenance-action-spin 1s linear infinite;
  }
  @keyframes maintenance-action-spin {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    :global(.maintenance-action-spinner) {
      animation: none;
    }
  }
</style>
