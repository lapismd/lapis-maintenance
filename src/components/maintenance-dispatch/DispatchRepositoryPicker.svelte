<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import * as CommandView from "@lapismd/design-core/shadcn/command-view";
  import { Check, ChevronsUpDown, FolderGit2 } from "@lucide/svelte";
  let {
    id,
    value,
    repositories,
    disabled = false,
    onChange,
  }: {
    id: string;
    value: string;
    repositories: string[];
    disabled?: boolean;
    onChange: (value: string) => void;
  } = $props();
  let open = $state(false);
</script>

<Popover.Root bind:open
  ><Popover.Trigger>
    {#snippet child({ props })}<Button
        {...props}
        {id}
        {disabled}
        role="combobox"
        variant="outline"
        aria-label="Choose repository"
        style="width:100%;min-width:0;justify-content:space-between"
      >
        <FolderGit2 data-icon="inline-start" aria-hidden="true" /><span
          style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;text-align:start"
          >{value || "Choose repository"}</span
        ><ChevronsUpDown aria-hidden="true" />
      </Button>{/snippet}
  </Popover.Trigger><Popover.Content
    align="start"
    collisionPadding={12}
    sideOffset={6}
    style="width:var(--bits-popover-anchor-width);max-width:calc(100vw - 2rem);padding:.5rem"
  >
    <CommandView.Root label="Search workflow repositories" loop>
      <CommandView.Input
        aria-label="Search workflow repositories"
        placeholder="Search repositories…"
      />
      <CommandView.List aria-label="Workflow repositories"
        ><CommandView.Empty>No repositories found.</CommandView.Empty>
        <CommandView.Group heading="Repositories">
          {#each repositories as repository}
            <CommandView.Item
              value={repository}
              onSelect={() => {
                if (!disabled) {
                  open = false;
                  onChange(repository);
                }
              }}
            >
              {#snippet child({ props })}<div
                  {...props}
                  role="option"
                  aria-selected={value === repository}
                >
                  <CommandView.ItemIcon
                    ><FolderGit2 aria-hidden="true" /></CommandView.ItemIcon
                  ><CommandView.ItemLabel>{repository}</CommandView.ItemLabel>
                  {#if value === repository}<Check aria-hidden="true" />{/if}
                </div>{/snippet}
            </CommandView.Item>
          {/each}
        </CommandView.Group>
      </CommandView.List>
    </CommandView.Root>
  </Popover.Content></Popover.Root
>
