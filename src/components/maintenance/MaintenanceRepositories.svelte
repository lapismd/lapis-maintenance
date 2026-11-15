<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Collapsible from "@lapismd/design-core/shadcn/collapsible";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import { Inbox, FolderGit2, ChevronDown } from "@lucide/svelte";
  import RepositoryActionStatus from "./RepositoryActionStatus.svelte";
  import RepositoryActionsFilter from "./RepositoryActionsFilter.svelte";
  import RepositoryFilter from "./RepositoryFilter.svelte";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  let {
    controller,
    compact,
    onRepository,
  }: {
    controller: MaintenanceController;
    compact: boolean;
    onRepository?: (repository?: string) => void;
  } = $props();
  let open = $state(true);
  const id = $props.id();
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
            ><RepositoryFilter
              {controller}
              compact
              onSelectRepository={onRepository}
            /></span
          >{/snippet}
      </Tooltip.Trigger>
      <Tooltip.Content side="right">Repositories</Tooltip.Content>
    </Tooltip.Root>
  {:else}
    <Collapsible.Root bind:open>
      <div class="maintenance-repository-header">
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
        </Collapsible.Trigger><RepositoryActionsFilter {controller} />
      </div>
      <Collapsible.Content>
        <div class="maintenance-repository-rows">
          <Button
            variant="ghost"
            aria-label="Show all repositories"
            aria-pressed={!controller.repositories.length}
            onclick={() =>
              onRepository ? onRepository() : (controller.repositories = [])}
            ><Inbox size={16} aria-hidden="true" /><span>All repositories</span
            ></Button
          >
          {#each controller.repositoryRows as repo}
            <Button
              variant="ghost"
              aria-label={`Show ${repo.repository}`}
              aria-pressed={controller.repositories.includes(repo.repository)}
              title={repo.repository}
              aria-describedby={`${id}-${repo.repository}`}
              onclick={() =>
                onRepository
                  ? onRepository(repo.repository)
                  : controller.toggleRepository(repo.repository)}
              ><FolderGit2 size={16} aria-hidden="true" /><span
                class="maintenance-repository-label"
                >{repo.repository.split("/")[1]}</span
              ><RepositoryActionStatus
                repository={repo}
                id={`${id}-${repo.repository}`}
              /></Button
            >
          {:else}<p class="maintenance-repository-empty">
              No repositories match these branch states.
            </p>{/each}
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  {/if}
</nav>
