<script lang="ts">
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import {
    CircleCheck,
    CircleX,
    LoaderCircle,
    CircleHelp,
  } from "@lucide/svelte";
  import type { RepositoryCoverage } from "../../maintenance/types";
  import {
    repositoryActionDescription,
    repositoryActionState,
  } from "../../maintenance/repository-actions";
  import "./repository-actions.css";
  let { repository, id }: { repository: RepositoryCoverage; id?: string } =
    $props();
  const state = $derived(repositoryActionState(repository));
  const description = $derived(repositoryActionDescription(repository));
  const Icon = $derived(
    {
      passed: CircleCheck,
      failed: CircleX,
      pending: LoaderCircle,
      unknown: CircleHelp,
    }[state],
  );
  const color = $derived(
    state === "passed"
      ? "var(--success, var(--chart-2))"
      : state === "failed"
        ? "var(--destructive)"
        : state === "pending"
          ? "var(--primary)"
          : "var(--muted-foreground)",
  );
</script>

<Tooltip.Provider
  ><Tooltip.Root
    ><Tooltip.Trigger>
      {#snippet child({ props })}<Badge
          {...props}
          {id}
          role="img"
          aria-label={description}
          class="repository-actions-badge"
          data-state={state}
          style={`--ui-badge-background:color-mix(in srgb,${color} 12%,transparent);--ui-badge-foreground:${color}`}
        >
          <Icon aria-hidden="true" />
        </Badge>{/snippet}
    </Tooltip.Trigger><Tooltip.Content
      >{description}{repository.loading
        ? " Refreshing cached status…"
        : ""}</Tooltip.Content
    ></Tooltip.Root
  ></Tooltip.Provider
>
