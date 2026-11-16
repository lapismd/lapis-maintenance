<script lang="ts">
  import RepositoryActionStatus from "./RepositoryActionStatus.svelte";
  import RepositoryActionsFilter from "./RepositoryActionsFilter.svelte";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import * as CommandView from "@lapismd/design-core/shadcn/command-view";
  import { Check, ChevronDown, FolderGit2 } from "@lucide/svelte";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  let {
    controller,
    compact = false,
    onSelectRepository,
  }: {
    controller: MaintenanceController;
    compact?: boolean;
    onSelectRepository?: (repository?: string) => void;
  } = $props();
  let open = $state(false);
  const id = $props.id();
  let search = $state("");
  // Apply repository-name and branch-status predicates together before presentation.
  const rows = $derived(
    controller.repositoryRows.filter((repo) =>
      repo.repository.toLowerCase().includes(search.trim().toLowerCase()),
    ),
  );
  $effect(() => {
    if (!open) search = "";
  });
  function select(repository?: string) {
    if (onSelectRepository) {
      onSelectRepository(repository);
      open = false;
    } else if (repository) controller.toggleRepository(repository);
    else controller.repositories = [];
  }
  const label = $derived(
    controller.repositories.length === 0
      ? "All repositories"
      : controller.repositories.length === 1
        ? controller.repositories[0]!.split("/")[1]
        : `${controller.repositories.length} repositories`,
  );
</script>

<Popover.Root bind:open>
  <Popover.Trigger>
    {#snippet child({ props })}
      <Button
        {...props}
        variant={controller.repositoryStatuses.length
          ? "secondary"
          : compact
            ? "ghost"
            : "outline"}
        size={compact ? "icon-sm" : "default"}
        aria-label={`Filter repositories: ${label}`}
      >
        {#if compact}<FolderGit2
            size={18}
            aria-hidden="true"
          />{:else}{label}<ChevronDown size={14} aria-hidden="true" />{/if}
      </Button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content
    align="start"
    side={compact ? "right" : "bottom"}
    sideOffset={8}
    collisionPadding={12}
    style="width:min(22rem,calc(100vw - 2rem));padding:0.5rem"
    aria-label="Choose repositories"
  >
    <div class="repository-picker-tools">
      <span>Default-branch Actions</span><RepositoryActionsFilter
        {controller}
      />
    </div>
    <CommandView.Root label="Search repositories" shouldFilter={false} loop>
      <CommandView.Input
        bind:value={search}
        aria-label="Search repositories"
        placeholder="Search repositories…"
      />
      <CommandView.List
        aria-label="Repositories"
        aria-multiselectable={!onSelectRepository}
      >
        <CommandView.Empty>No repositories found.</CommandView.Empty>
        <CommandView.Group heading="Repositories">
          <CommandView.Item
            style="margin-block:0.125rem"
            value="All repositories"
            onSelect={() => select()}
          >
            {#snippet child({ props })}
              <div
                {...props}
                role="option"
                aria-selected={!controller.repositories.length}
              >
                <CommandView.ItemLabel>All repositories</CommandView.ItemLabel>
                {#if !controller.repositories.length}<Check
                    size={16}
                    aria-hidden="true"
                  />{/if}
              </div>
            {/snippet}
          </CommandView.Item>
          {#each rows as repo (repo.repository)}
            <CommandView.Item
              style="margin-block:0.125rem"
              value={repo.repository}
              onSelect={() => select(repo.repository)}
            >
              {#snippet child({ props })}
                <div
                  {...props}
                  role="option"
                  aria-label={repo.repository}
                  aria-describedby={`${id}-${repo.repository}`}
                  aria-selected={controller.repositories.includes(
                    repo.repository,
                  )}
                >
                  <CommandView.ItemIcon
                    ><FolderGit2
                      size={16}
                      aria-hidden="true"
                    /></CommandView.ItemIcon
                  >
                  <CommandView.ItemLabel
                    >{repo.repository}</CommandView.ItemLabel
                  >
                  <RepositoryActionStatus
                    repository={repo}
                    id={`${id}-${repo.repository}`}
                  />
                  {#if controller.repositories.includes(repo.repository)}<Check
                      size={16}
                      aria-hidden="true"
                    />{/if}
                </div>
              {/snippet}
            </CommandView.Item>
          {/each}
        </CommandView.Group>
      </CommandView.List>
      <CommandView.Footer
        >{onSelectRepository ? "Select a repository" : "Select multiple"} · Escape
        to close</CommandView.Footer
      >
    </CommandView.Root>
  </Popover.Content>
</Popover.Root>
