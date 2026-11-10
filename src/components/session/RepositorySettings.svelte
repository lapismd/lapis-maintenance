<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Textarea } from "@lapismd/design-core/shadcn/textarea";
  import { Checkbox } from "@lapismd/design-core/shadcn/checkbox";
  import { ScrollArea } from "@lapismd/design-core/shadcn/scroll-area";
  import * as Dialog from "@lapismd/design-core/shadcn/dialog";
  import { Settings2, FolderGit2 } from "@lucide/svelte";
  import type { MaintenanceSession } from "../../session/session.svelte";
  import { validRepository } from "../../github/models";
  let {
    session,
  }: {
    session: Pick<MaintenanceSession, "selection" | "configure"> &
      Partial<Pick<MaintenanceSession, "repositoryDefaults">>;
  } = $props();
  let open = $state(false),
    additions = $state(""),
    exclusions = $state(""),
    error = $state("");
  const id = $props.id();
  const split = (text: string) => [
    ...new Set(
      text
        .split(/[\n,]/)
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ];
</script>

<Dialog.Root
  bind:open
  onOpenChange={(value) => {
    if (value) {
      additions = session.selection.additions.join("\n");
      exclusions = session.selection.exclusions.join("\n");
      error = "";
    }
  }}
>
  <Dialog.Trigger
    >{#snippet child({ props })}<Button
        {...props}
        variant="ghost"
        size="icon-sm"
        aria-label="Repository settings"
        title="Repository settings"
        ><Settings2 size={15} aria-hidden="true" /></Button
      >{/snippet}</Dialog.Trigger
  >
  <Dialog.Content>
    <Dialog.Header
      ><Dialog.Title>Repository settings</Dialog.Title><Dialog.Description
        >Defaults follow dependency-automation's current allowlist. Select
        repositories below or enter additional owner/repository names.</Dialog.Description
      ></Dialog.Header
    >
    <fieldset class="repository-defaults">
      <legend>Default repositories</legend>
      {#if session.repositoryDefaults?.length}
        <ScrollArea
          style="max-height:14rem"
          viewportProps={{
            style: "max-height:14rem",
            role: "region",
            "aria-label": "Allowlisted repositories",
          }}
        >
          <ul>
            {#each session.repositoryDefaults as repo, index (repo.repository)}<li
              >
                <Checkbox
                  id={`${id}-repo-${index}`}
                  checked={!split(exclusions).includes(repo.repository)}
                  onCheckedChange={(checked) => {
                    const next = new Set(split(exclusions));
                    if (checked) next.delete(repo.repository);
                    else next.add(repo.repository);
                    exclusions = [...next].join("\n");
                  }}
                />
                <label for={`${id}-repo-${index}`} title={repo.repository}
                  ><FolderGit2 size={15} aria-hidden="true" /><span
                    >{repo.repository}</span
                  ></label
                >
              </li>{/each}
          </ul>
        </ScrollArea>
      {:else}<p class="maintenance-muted">
          The current allowlist is loading or unavailable. Explicit repository
          entries still apply.
        </p>{/if}
    </fieldset>
    <label for={`${id}-add`}>Additional repositories</label><Textarea
      id={`${id}-add`}
      bind:value={additions}
      placeholder="owner/repository"
    />
    <label for={`${id}-exclude`}>Excluded repositories</label><Textarea
      id={`${id}-exclude`}
      bind:value={exclusions}
    />
    {#if error}<p role="alert">{error}</p>{/if}
    <Dialog.Footer
      ><Button variant="ghost" onclick={() => (open = false)}>Cancel</Button
      ><Button
        onclick={async () => {
          const selection = {
            additions: split(additions),
            exclusions: split(exclusions),
          };
          if (
            [...selection.additions, ...selection.exclusions].some(
              (value) => !validRepository(value),
            )
          ) {
            error = "Use owner/repository names without URLs.";
            return;
          }
          try {
            await session.configure(selection);
            open = false;
          } catch {
            error = "Repository settings could not be saved. Retry.";
          }
        }}>Save repositories</Button
      ></Dialog.Footer
    >
  </Dialog.Content>
</Dialog.Root>

<style>
  .repository-defaults {
    border: 0;
    padding: 0;
    min-width: 0;
    margin: 0;
  }
  .repository-defaults legend {
    margin-bottom: 0.65rem;
    font-size: 0.85rem;
    font-weight: 550;
  }
  .repository-defaults ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .repository-defaults li {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.4rem 0.15rem;
  }
  .repository-defaults label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
    font-size: 0.8rem;
    cursor: pointer;
  }
  .repository-defaults label span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .repository-defaults label :global(svg) {
    flex: none;
    color: var(--muted-foreground);
  }
</style>
