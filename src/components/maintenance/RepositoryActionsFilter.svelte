<script lang="ts">
  import "./repository-actions.css";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import * as CommandView from "@lapismd/design-core/shadcn/command-view";
  import {
    SquareCheck,
    Square,
    ListFilter,
    CircleCheck,
    CircleX,
    Clock,
    CircleHelp,
  } from "@lucide/svelte";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  import {
    repositoryActionLabels,
    type RepositoryActionState,
  } from "../../maintenance/repository-actions";
  let { controller }: { controller: MaintenanceController } = $props();
  const label = $derived(
    controller.repositoryStatuses.length
      ? controller.repositoryStatuses
          .map((s) => repositoryActionLabels[s])
          .join(", ")
      : "All states",
  );
  const icons = {
    passed: CircleCheck,
    failed: CircleX,
    pending: Clock,
    unknown: CircleHelp,
  };
  function toggle(state: RepositoryActionState) {
    controller.repositoryStatuses = controller.repositoryStatuses.includes(
      state,
    )
      ? controller.repositoryStatuses.filter((s) => s !== state)
      : [...controller.repositoryStatuses, state];
  }
</script>

<Popover.Root
  ><Popover.Trigger>
    {#snippet child({ props })}<Button
        {...props}
        size="icon-sm"
        variant={controller.repositoryStatuses.length ? "secondary" : "ghost"}
        class="repository-actions-filter-trigger"
        aria-label={`Filter default-branch Actions: ${label}`}
        title={`Default-branch Actions: ${label}`}
        ><ListFilter aria-hidden="true" /></Button
      >{/snippet}
  </Popover.Trigger><Popover.Content
    align="end"
    collisionPadding={12}
    style="width:14rem;padding:.5rem;--ui-command-view-icon-size:.875rem"
    aria-label="Filter repositories by branch Actions"
  >
    <CommandView.Root label="Branch Actions states" loop
      ><CommandView.List
        aria-label="Branch Actions states"
        aria-multiselectable="true"
      >
        <CommandView.Group heading="Default-branch Actions">
          <CommandView.Item
            value="All branch states"
            onSelect={() => (controller.repositoryStatuses = [])}
          >
            {#snippet child({ props })}<div
                {...props}
                class="repository-actions-option"
                role="option"
                aria-selected={!controller.repositoryStatuses.length}
              >
                <CommandView.ItemIcon
                  ><ListFilter aria-hidden="true" /></CommandView.ItemIcon
                >
                <CommandView.ItemLabel>All states</CommandView.ItemLabel><span
                  class="repository-actions-selection"
                  >{#if !controller.repositoryStatuses.length}<SquareCheck
                      aria-hidden="true"
                    />{:else}<Square aria-hidden="true" />{/if}</span
                >
              </div>{/snippet}
          </CommandView.Item>
          {#each Object.entries(repositoryActionLabels) as [state, label]}
            {@const Icon = icons[state as RepositoryActionState]}
            <CommandView.Item
              value={label}
              onSelect={() => toggle(state as RepositoryActionState)}
            >
              {#snippet child({ props })}<div
                  {...props}
                  class="repository-actions-option"
                  role="option"
                  aria-selected={controller.repositoryStatuses.includes(
                    state as RepositoryActionState,
                  )}
                >
                  <CommandView.ItemIcon
                    ><Icon aria-hidden="true" /></CommandView.ItemIcon
                  ><CommandView.ItemLabel>{label}</CommandView.ItemLabel>
                  <span class="repository-actions-selection"
                    >{#if controller.repositoryStatuses.includes(state as RepositoryActionState)}<SquareCheck
                        aria-hidden="true"
                      />{:else}<Square aria-hidden="true" />{/if}</span
                  >
                </div>{/snippet}
            </CommandView.Item>
          {/each}
        </CommandView.Group>
      </CommandView.List><CommandView.Footer
        >Select multiple · filters repositories and views</CommandView.Footer
      ></CommandView.Root
    >
  </Popover.Content></Popover.Root
>
