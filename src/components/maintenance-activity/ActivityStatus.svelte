<script lang="ts">
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import {
    CircleCheck,
    CircleX,
    ShieldCheck,
    GitPullRequest,
    Lock,
    GitPullRequestDraft,
    LoaderCircle,
    CircleSlash,
    CircleHelp,
  } from "@lucide/svelte";
  import { statusLabels, type ItemStatus } from "../../maintenance/types";
  let { status }: { status: ItemStatus } = $props();
  const icons = {
    "approval-wait": ShieldCheck,
    failed: CircleX,
    "review-needed": GitPullRequest,
    blocked: Lock,
    draft: GitPullRequestDraft,
    running: LoaderCircle,
    cancelled: CircleSlash,
    unavailable: CircleHelp,
    passed: CircleCheck,
  };
  const colors = {
    "approval-wait": "var(--warning)",
    failed: "var(--destructive)",
    "review-needed": "var(--primary)",
    blocked: "var(--warning)",
    draft: "var(--muted-foreground)",
    running: "var(--primary)",
    cancelled: "var(--muted-foreground)",
    unavailable: "var(--muted-foreground)",
    passed: "var(--success)",
  };
  const Icon = $derived(icons[status]);
</script>

<span
  class="activity-status"
  style={`--activity-status-color:${colors[status]}`}
>
  <Badge
    style="--ui-badge-background:color-mix(in srgb,var(--activity-status-color) 10%,var(--background));--ui-badge-foreground:color-mix(in srgb,var(--activity-status-color) 40%,var(--foreground));--ui-badge-border-color:color-mix(in srgb,var(--activity-status-color) 20%,var(--border));--ui-badge-radius:999px"
  >
    <Icon size={12} aria-hidden="true" />{statusLabels[status]}
  </Badge>
</span>
