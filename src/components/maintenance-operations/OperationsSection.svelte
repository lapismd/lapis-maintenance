<script lang="ts">
  import { useOperationsDisclosure } from "./disclosure.svelte";
  import type { Snippet } from "svelte";
  import type { Workflow } from "@lucide/svelte";
  import { ChevronDown, ChevronRight } from "@lucide/svelte";
  import * as Collapsible from "@lapismd/design-core/shadcn/collapsible";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  let {
    title,
    count,
    icon: Icon,
    children,
  }: {
    title: string;
    count?: number;
    icon: typeof Workflow;
    children: Snippet;
  } = $props();
  const disclosure = useOperationsDisclosure(() => count !== 0);
</script>

<section class="operations-section" aria-label={title}>
  <Collapsible.Root bind:open={disclosure.open}>
    <header class="operations-section-header">
      <h3 class="operations-section-heading">
        <Collapsible.Trigger
          >{#snippet child({ props })}<Button
              {...props}
              variant="ghost"
              class="operations-section-toggle"
            >
              <span class="operations-section-icon"
                ><Icon size={15} aria-hidden="true" /></span
              ><span class="operations-section-label">{title}</span>
              {#if count !== undefined}<Badge variant="secondary">{count}</Badge
                >{/if}
              {#if disclosure.open}<ChevronDown
                  aria-hidden="true"
                />{:else}<ChevronRight aria-hidden="true" />{/if}
            </Button>{/snippet}</Collapsible.Trigger
        >
      </h3>
    </header>
    <Collapsible.Content
      ><div class="operations-section-content">
        {@render children()}
      </div></Collapsible.Content
    >
  </Collapsible.Root>
</section>
