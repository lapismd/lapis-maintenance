<script lang="ts">
  import { RepositoryForgePanel } from "@lapismd/repository-ui/jj";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import * as Collapsible from "@lapismd/design-core/shadcn/collapsible";
  import {
    CircleCheck,
    CircleX,
    CircleHelp,
    Clock,
    ChevronDown,
    ExternalLink,
    RefreshCw,
  } from "@lucide/svelte";
  import ReviewResource from "./ReviewResource.svelte";
  import ReviewActions from "./ReviewActions.svelte";
  import type { ReviewController } from "../../maintenance/review/controller.svelte";
  import type { ReviewCheck } from "../../maintenance/review/types";
  import "./review.css";
  let { controller }: { controller: ReviewController } = $props();
  let expanded = $state(true),
    initializedId = $state("");
  const checks = $derived(controller.resources.checks.data ?? []);
  const passed = $derived(
    checks.filter((check) => check.state === "passed").length,
  );
  const states: ReviewCheck["state"][] = [
    "failed",
    "running",
    "queued",
    "unknown",
    "passed",
  ];
  const groups = $derived(
    states
      .map((state) => ({
        state,
        checks: checks.filter((check) => check.state === state),
      }))
      .filter((group) => group.checks.length),
  );
  const summary = $derived(
    !checks.length
      ? "No checks reported"
      : passed === checks.length
        ? "All checks have passed"
        : checks.some((check) => check.state === "failed")
          ? "Some checks have failed"
          : "Checks are still pending",
  );
  $effect(() => {
    if (
      controller.selectedId &&
      initializedId !== controller.selectedId &&
      controller.resources.checks.data
    ) {
      initializedId = controller.selectedId;
      expanded = checks.length > 0;
    }
  });
</script>

<RepositoryForgePanel
  title="Checks"
  label="Checks"
  ariaLabel="PR checks"
  bind:expanded
>
  {#snippet leading()}<CircleCheck size={16} aria-hidden="true" />{/snippet}
  {#snippet context()}<Badge variant="secondary">{checks.length}</Badge
    >{/snippet}
  {#snippet actions()}<Button
      variant="ghost"
      size="icon-sm"
      aria-label="Refresh PR checks"
      disabled={controller.resources.checks.loading}
      onclick={() => controller.load("checks")}
      ><RefreshCw size={14} aria-hidden="true" /></Button
    >{/snippet}
  <ReviewResource
    state={controller.resources.checks}
    label="Checks"
    onRetry={() => controller.load("checks")}
  >
    <div class="review-check-summary">
      <svg class="review-check-ring" viewBox="0 0 36 36" aria-hidden="true"
        ><circle
          cx="18"
          cy="18"
          r="14"
          fill="none"
          stroke="var(--border)"
          stroke-width="3"
        /><circle
          cx="18"
          cy="18"
          r="14"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          pathLength="100"
          stroke-dasharray={`${checks.length ? (passed / checks.length) * 100 : 0} 100`}
          transform="rotate(-90 18 18)"
        /></svg
      >
      <div>
        <strong>{summary}</strong>
        <p class="review-muted">
          {passed} passed{checks.length > passed
            ? ` · ${checks.length - passed} pending or unavailable`
            : ""}
        </p>
      </div>
    </div>
    <p class="review-check-revision">
      Revision <code>{controller.overview?.sha.slice(0, 8)}</code>
    </p>
    {#each groups as group (group.state)}
      <Collapsible.Root open>
        <Collapsible.Trigger
          >{#snippet child({ props })}<Button
              {...props}
              variant="ghost"
              class="review-check-group-toggle"
              >{group.checks.length}
              {group.state[0]!.toUpperCase() + group.state.slice(1)} checks<ChevronDown
                size={14}
                aria-hidden="true"
              /></Button
            >{/snippet}</Collapsible.Trigger
        >
        <Collapsible.Content>
          <ul class="review-check-list">
            {#each group.checks as check (check.id)}<li
                class="review-check-row"
                data-state={check.state}
              >
                {#if check.state === "passed"}<CircleCheck
                    size={17}
                    aria-hidden="true"
                  />{:else if check.state === "failed"}<CircleX
                    size={17}
                    aria-hidden="true"
                  />{:else if check.state === "unknown"}<CircleHelp
                    size={17}
                    aria-hidden="true"
                  />{:else}<Clock size={17} aria-hidden="true" />{/if}
                <div>
                  {#if check.url}<a
                      href={check.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      >{check.name}<ExternalLink
                        size={11}
                        aria-hidden="true"
                      /></a
                    >{:else}<strong>{check.name}</strong>{/if}
                  <p>{check.state} · {check.description}</p>
                  <span>{check.workflow}</span>
                </div>
              </li>{/each}
          </ul>
        </Collapsible.Content>
      </Collapsible.Root>
    {/each}
  </ReviewResource>
  {#if controller.overview?.kind === "pull-request"}<div
      class="review-check-footer"
    >
      <ReviewActions {controller} mode="merge" />
    </div>{/if}
</RepositoryForgePanel>
