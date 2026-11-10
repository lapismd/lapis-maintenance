<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Collapsible from "@lapismd/design-core/shadcn/collapsible";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import { Inbox, FolderGit2, ChevronDown } from "@lucide/svelte";
  import RepositoryFilter from "./RepositoryFilter.svelte";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  let {
    controller,
    compact,
  }: { controller: MaintenanceController; compact: boolean } = $props();
  let open = $state(true);
</script>

<nav
  class="maintenance-navigation"
  data-compact={compact}
  aria-label="Repository filters"
>
  {#if compact}
    <Tooltip.Root>
      <Tooltip.Trigger>
        {#snippet child({ props })}<span {...props} tabindex="-1"
            ><RepositoryFilter {controller} compact /></span
          >{/snippet}
      </Tooltip.Trigger>
      <Tooltip.Content side="right">Repositories</Tooltip.Content>
    </Tooltip.Root>
  {:else}
    <Collapsible.Root bind:open>
      <Collapsible.Trigger>
        {#snippet child({ props })}<Button
            {...props}
            variant="ghost"
            class="maintenance-repository-heading"
            aria-label="Toggle repositories"
            ><ChevronDown
              size={14}
              style={open ? undefined : "transform:rotate(-90deg)"}
              aria-hidden="true"
            />Repositories</Button
          >{/snippet}
      </Collapsible.Trigger>
      <Collapsible.Content>
        <div class="maintenance-repository-rows">
          <Button
            variant="ghost"
            aria-label="Show all repositories"
            aria-pressed={!controller.repositories.length}
            onclick={() => (controller.repositories = [])}
            ><Inbox size={16} aria-hidden="true" /><span>All repositories</span
            ></Button
          >
          {#each controller.snapshot?.repositories ?? [] as repo}
            <Button
              variant="ghost"
              aria-label={`Show ${repo.repository}`}
              aria-pressed={controller.repositories.includes(repo.repository)}
              title={repo.repository}
              onclick={() => controller.toggleRepository(repo.repository)}
              ><FolderGit2 size={16} aria-hidden="true" /><span
                >{repo.repository.split("/")[1]}</span
              ></Button
            >
          {/each}
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  {/if}
</nav>
