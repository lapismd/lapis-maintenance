<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import * as CommandView from "@lapismd/design-core/shadcn/command-view";
  import { Check, ChevronDown, FolderGit2 } from "@lucide/svelte";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  let { controller }: { controller: MaintenanceController } = $props();
  const label = $derived(
    controller.repositories.length === 0
      ? "All repositories"
      : controller.repositories.length === 1
        ? controller.repositories[0]!.split("/")[1]
        : `${controller.repositories.length} repositories`,
  );
</script>

<Popover.Root>
  <Popover.Trigger>
    {#snippet child({ props })}
      <Button
        {...props}
        variant="outline"
        aria-label={`Filter repositories: ${label}`}
      >
        {label}<ChevronDown size={14} aria-hidden="true" />
      </Button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content
    align="start"
    sideOffset={8}
    collisionPadding={12}
    style="width:min(22rem,calc(100vw - 2rem));padding:0.5rem"
    aria-label="Choose repositories"
  >
    <CommandView.Root label="Search repositories" loop>
      <CommandView.Input
        aria-label="Search repositories"
        placeholder="Search repositories…"
      />
      <CommandView.List aria-label="Repositories" aria-multiselectable="true">
        <CommandView.Empty>No repositories found.</CommandView.Empty>
        <CommandView.Group heading="Repositories">
          <CommandView.Item
            value="All repositories"
            onSelect={() => (controller.repositories = [])}
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
          {#each controller.snapshot?.repositories ?? [] as repo (repo.repository)}
            <CommandView.Item
              value={repo.repository}
              onSelect={() => controller.toggleRepository(repo.repository)}
            >
              {#snippet child({ props })}
                <div
                  {...props}
                  role="option"
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
      <CommandView.Footer>Select multiple · Escape to close</CommandView.Footer>
    </CommandView.Root>
  </Popover.Content>
</Popover.Root>
