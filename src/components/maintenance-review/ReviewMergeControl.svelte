<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as ButtonGroup from "@lapismd/design-core/shadcn/button-group";
  import * as DropdownMenu from "@lapismd/design-core/shadcn/dropdown-menu";
  import MaintenanceActionIcon from "../maintenance/MaintenanceActionIcon.svelte";
  import { ChevronDown, GitMerge } from "@lucide/svelte";
  import type { ReviewController } from "../../maintenance/review/controller.svelte";
  type MergeMethod = "merge" | "squash" | "rebase";
  let { controller }: { controller: ReviewController } = $props();
  const pr = $derived(controller.pullRequest);
  const methods = $derived<MergeMethod[]>(pr?.mergeMethods ?? ["squash"]);
  let choice = $state<MergeMethod>("squash");
  const method = $derived(methods.includes(choice) ? choice : methods[0]);
  const labels = {
    squash: "Squash and merge",
    merge: "Create merge commit",
    rebase: "Rebase and merge",
  };
  const disabled = $derived(
    !controller.canMerge || controller.pending || !method,
  );
  const autoKind = $derived(
    pr?.autoMerge ? "disable-auto-merge" : "enable-auto-merge",
  );
  const autoAction = $derived(
    pr?.actions?.find((action) => action.kind === autoKind),
  );
  const autoDisabled = $derived(
    controller.pending ||
      controller.resources.overview.loading ||
      !!controller.resources.overview.error ||
      !autoAction?.available ||
      (autoKind === "enable-auto-merge" && disabled),
  );
  function prepare(
    kind: "merge-pr" | "enable-auto-merge" | "disable-auto-merge" = "merge-pr",
  ) {
    if (!pr || (kind === "merge-pr" ? disabled : autoDisabled)) return;
    controller.prepare(
      kind,
      pr.id,
      kind === "merge-pr"
        ? labels[method!]
        : kind === "enable-auto-merge"
          ? "Enable auto-merge"
          : "Disable auto-merge",
    );
    if (controller.confirmation)
      controller.confirmation = {
        ...controller.confirmation,
        mergeMethod: method,
      };
  }
</script>

<ButtonGroup.Root aria-label="Pull request merge controls">
  <Button size="sm" {disabled} onclick={() => prepare()}
    ><GitMerge data-icon="inline-start" aria-hidden="true" />{method
      ? labels[method]
      : "Merge PR"}</Button
  >
  {#if methods.length > 1}
    <ButtonGroup.Separator />
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        {#snippet child({ props })}<Button
            {...props}
            size="icon-sm"
            {disabled}
            aria-label="Choose merge method"
            title="Choose merge method"
            ><ChevronDown aria-hidden="true" /></Button
          >{/snippet}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        align="end"
        style="width:max-content;min-width:15rem"
      >
        <DropdownMenu.Group>
          <DropdownMenu.Label>Merge method</DropdownMenu.Label>
          <DropdownMenu.RadioGroup
            value={method ?? ""}
            onValueChange={(value) => {
              if (methods.includes(value as MergeMethod))
                choice = value as MergeMethod;
            }}
          >
            {#each methods as option}<DropdownMenu.RadioItem
                value={option}
                style="white-space:nowrap"
                ><GitMerge aria-hidden="true" />{labels[
                  option
                ]}</DropdownMenu.RadioItem
              >{/each}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Group>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  {/if}
</ButtonGroup.Root>

<Button
  size="sm"
  variant="outline"
  disabled={autoDisabled}
  title={autoAction?.reason ??
    "Auto-merge needs repository write access and must be enabled in GitHub settings."}
  onclick={() => prepare(autoKind)}
  ><MaintenanceActionIcon kind={autoKind} />{autoKind === "enable-auto-merge"
    ? "Enable auto-merge"
    : "Disable auto-merge"}</Button
>
{#if pr?.autoMerge}<p class="review-muted">
    Auto-merge enabled · {labels[pr.autoMerge.method]}{pr.autoMerge.enabledBy
      ? ` · ${pr.autoMerge.enabledBy}`
      : ""}
  </p>{/if}
