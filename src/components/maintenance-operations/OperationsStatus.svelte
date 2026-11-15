<script lang="ts">
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import { CircleCheck, CircleAlert, Clock3 } from "@lucide/svelte";
  import { operationTone } from "../../maintenance/operations";
  let { status }: { status: string } = $props();
  const tone = $derived(operationTone(status));
  const color = $derived(
    tone === "failure"
      ? "color-mix(in srgb,var(--destructive) 45%,var(--foreground))"
      : tone === "attention"
        ? "color-mix(in srgb,var(--warning, var(--chart-4)) 45%,var(--foreground))"
        : tone === "success"
          ? "color-mix(in srgb,var(--success, var(--chart-2)) 55%,var(--foreground))"
          : /wait|running|admitted|refresh/.test(status)
            ? "color-mix(in srgb,var(--primary) 45%,var(--foreground))"
            : "var(--muted-foreground)",
  );
</script>

<Badge
  variant="default"
  data-operation-status={status}
  style={`--ui-badge-background:color-mix(in srgb,${color} 12%,transparent);--ui-badge-foreground:${color}`}
>
  {#if tone === "success"}<CircleCheck
      aria-hidden="true"
    />{:else if tone === "failure" || tone === "attention"}<CircleAlert
      aria-hidden="true"
    />{:else}<Clock3 aria-hidden="true" />{/if}
  {status.replaceAll("-", " ")}
</Badge>
