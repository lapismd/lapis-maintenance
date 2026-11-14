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
  } from "@lucide/svelte";
  import type { ActionKind } from "../../maintenance/types";
  let {
    kind,
  }: {
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

<Icon size={15} aria-hidden="true" data-icon="inline-start" />
