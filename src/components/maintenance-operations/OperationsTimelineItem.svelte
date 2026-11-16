<script lang="ts">
  import "./operations-content.css";
  import type { Snippet } from "svelte";
  import { useOperationsDisclosure } from "./disclosure.svelte";
  import * as Collapsible from "@lapismd/design-core/shadcn/collapsible";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { CircleDot, ChevronRight, ChevronDown } from "@lucide/svelte";
  import { operationTone } from "../../maintenance/operations";
  import OperationsStatus from "./OperationsStatus.svelte";
  import "./operations-timeline.css";
  let {
    title,
    summary,
    status,
    icon: Icon = CircleDot,
    children,
  }: {
    title: string;
    summary: string;
    status: string;
    icon?: typeof CircleDot;
    children: Snippet;
  } = $props();
  const disclosure = useOperationsDisclosure(() => false);
</script>

<li class="operations-timeline-row" data-tone={operationTone(status)}>
  <Collapsible.Root bind:open={disclosure.open}>
    <Collapsible.Trigger
      >{#snippet child({ props })}<Button
          {...props}
          variant="ghost"
          class="operations-row-toggle"
        >
          <span class="operations-row-icon"
            ><Icon size={16} aria-hidden="true" /></span
          >
          <span class="operations-row-copy"
            ><strong>{title}</strong><span>{summary}</span></span
          >
          <OperationsStatus {status} />
          <span class="operations-row-chevron"
            >{#if disclosure.open}<ChevronDown
                size={14}
                aria-hidden="true"
              />{:else}<ChevronRight size={14} aria-hidden="true" />{/if}</span
          >
        </Button>{/snippet}</Collapsible.Trigger
    >
    <Collapsible.Content
      ><div class="operations-row-details">
        {@render children()}
      </div></Collapsible.Content
    >
  </Collapsible.Root>
</li>
