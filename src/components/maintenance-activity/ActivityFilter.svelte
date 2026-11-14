<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import * as CommandView from "@lapismd/design-core/shadcn/command-view";
  import {
    Check,
    ListFilter,
    GitPullRequest,
    GitPullRequestArrow,
    CircleCheck,
    Workflow,
    ShieldCheck,
    MessageSquare,
    GitCommitHorizontal,
  } from "@lucide/svelte";
  import {
    activityKinds,
    type ActivityKind,
  } from "../../maintenance/activity/types";
  import type { ActivityController } from "../../maintenance/activity/controller.svelte";
  const icons = {
    "pull-request": GitPullRequest,
    review: GitPullRequestArrow,
    check: CircleCheck,
    workflow: Workflow,
    deployment: ShieldCheck,
    comment: MessageSquare,
    commit: GitCommitHorizontal,
  };
  let { controller }: { controller: ActivityController } = $props();
  const label = $derived(
    controller.kinds.length
      ? `${controller.kinds.length} event ${controller.kinds.length === 1 ? "type" : "types"}`
      : "All activity",
  );
  function toggle(kind: ActivityKind) {
    controller.kinds = controller.kinds.includes(kind)
      ? controller.kinds.filter((value) => value !== kind)
      : [...controller.kinds, kind];
  }
</script>

<Popover.Root>
  <Popover.Trigger
    >{#snippet child({ props })}<Button
        {...props}
        variant="outline"
        size="sm"
        aria-label={`Filter activity types: ${label}`}
        ><ListFilter size={15} aria-hidden="true" />{label}</Button
      >{/snippet}</Popover.Trigger
  >
  <Popover.Content
    align="end"
    collisionPadding={12}
    style="width:min(20rem,calc(100vw - 2rem));padding:0.5rem"
    aria-label="Activity event filters"
  >
    <CommandView.Root label="Activity event types" loop>
      <CommandView.Input
        placeholder="Find an event type…"
        aria-label="Find an activity type"
      />
      <CommandView.List
        aria-label="Activity event types"
        aria-multiselectable="true"
      >
        <CommandView.Empty>No matching activity types</CommandView.Empty>
        <CommandView.Group heading="Event types">
          <CommandView.Item
            value="All activity"
            style="margin-block:0.125rem"
            onSelect={() => (controller.kinds = [])}
            >{#snippet child({ props })}<div
                {...props}
                role="option"
                aria-selected={!controller.kinds.length}
              >
                <CommandView.ItemIcon
                  ><ListFilter aria-hidden="true" /></CommandView.ItemIcon
                ><CommandView.ItemLabel>All activity</CommandView.ItemLabel
                >{#if !controller.kinds.length}<span
                    data-ui-component="command-view"
                    data-ui-part="trailing"
                    ><Check size={15} aria-hidden="true" /></span
                  >{/if}
              </div>{/snippet}</CommandView.Item
          >
          {#each Object.entries(activityKinds) as [kind, label] (kind)}
            {@const Icon = icons[kind as ActivityKind]}
            <CommandView.Item
              value={label}
              style="margin-block:0.125rem"
              onSelect={() => toggle(kind as ActivityKind)}
              >{#snippet child({ props })}<div
                  {...props}
                  role="option"
                  aria-selected={controller.kinds.includes(
                    kind as ActivityKind,
                  )}
                >
                  <CommandView.ItemIcon
                    ><Icon aria-hidden="true" /></CommandView.ItemIcon
                  ><CommandView.ItemLabel>{label}</CommandView.ItemLabel
                  >{#if controller.kinds.includes(kind as ActivityKind)}<span
                      data-ui-component="command-view"
                      data-ui-part="trailing"
                      ><Check size={15} aria-hidden="true" /></span
                    >{/if}
                </div>{/snippet}</CommandView.Item
            >
          {/each}
        </CommandView.Group>
      </CommandView.List>
    </CommandView.Root>
  </Popover.Content>
</Popover.Root>
