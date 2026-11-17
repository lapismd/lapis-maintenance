<script lang="ts">
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import {
    GitPullRequest,
    GitPullRequestDraft,
    GitMerge,
    GitPullRequestClosed,
    Workflow,
  } from "@lucide/svelte";
  import type { ReviewOverview } from "../../maintenance/review/types";
  let {
    overview,
  }: {
    overview: Pick<ReviewOverview, "kind" | "state" | "draft">;
  } = $props();
  const status = $derived(
    overview.kind !== "pull-request"
      ? "workflow"
      : overview.state !== "open"
        ? overview.state
        : overview.draft
          ? "draft"
          : "open",
  );
  const states = {
    open: { label: "Open", icon: GitPullRequest, color: "var(--success)" },
    draft: {
      label: "Draft",
      icon: GitPullRequestDraft,
      color: "var(--muted-foreground)",
    },
    merged: { label: "Merged", icon: GitMerge, color: "var(--primary)" },
    closed: {
      label: "Closed",
      icon: GitPullRequestClosed,
      color: "var(--destructive)",
    },
    workflow: {
      label: "Workflow",
      icon: Workflow,
      color: "var(--muted-foreground)",
    },
  };
  const details = $derived(states[status]);
  const Icon = $derived(details.icon);
</script>

<Badge
  data-review-status={status}
  style={`--review-status-color:${details.color};--ui-badge-background:color-mix(in srgb,var(--review-status-color) 12%,var(--background));--ui-badge-foreground:color-mix(in srgb,var(--review-status-color) 40%,var(--foreground));--ui-badge-border-color:color-mix(in srgb,var(--review-status-color) 25%,var(--border));--ui-badge-radius:999px`}
>
  <Icon size={12} data-icon="inline-start" aria-hidden="true" />{details.label}
</Badge>
