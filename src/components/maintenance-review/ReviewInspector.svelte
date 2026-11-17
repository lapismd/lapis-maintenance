<script lang="ts">
  import { AppShell } from "@lapismd/design-core/shell";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import ReviewStatus from "./ReviewStatus.svelte";
  import { Maximize2, RefreshCw } from "@lucide/svelte";
  import GitHubIcon from "../maintenance/GitHubIcon.svelte";
  import ReviewChecks from "./ReviewChecks.svelte";
  import ReviewApprovals from "./ReviewApprovals.svelte";
  import ReviewActions from "./ReviewActions.svelte";
  import ReviewFeedback from "./ReviewFeedback.svelte";
  import type { ReviewController } from "../../maintenance/review/controller.svelte";
  let {
    controller,
    onOpen,
  }: { controller: ReviewController; onOpen: () => void } = $props();
  const pr = $derived(controller.overview);
</script>

<AppShell.Sidebar
  side="right"
  label="Review inspector"
  variant="attached"
  mobileLabel="Details"
  closeable
  constraintPriority={20}
  constrainedPresentation="replace-main"
>
  <AppShell.Sidebar.Header
    ><div class="maintenance-inspector-heading">
      <strong>Details</strong><span class="maintenance-toolbar-spacer"
      ></span><Button
        variant="ghost"
        size="icon-sm"
        aria-label="Refresh review details"
        disabled={controller.pending}
        onclick={() => controller.refresh()}
        ><RefreshCw size={15} aria-hidden="true" /></Button
      >{#if pr}<a
          class="maintenance-icon-link"
          href={pr.url}
          aria-label="Open review target on GitHub"
          target="_blank"
          rel="noopener noreferrer"><GitHubIcon /></a
        >{/if}<AppShell.Sidebar.Close />
    </div></AppShell.Sidebar.Header
  >
  <AppShell.Sidebar.Body>
    {#if pr}<div class="review-inspector">
        <span class="review-eyebrow"
          >{pr.kind === "pull-request"
            ? "Pull request"
            : pr.kind === "approval"
              ? "Deployment"
              : "Workflow"} · {pr.repository}</span
        >
        <h2>{pr.title}</h2>
        <div class="review-button-row">
          <ReviewStatus overview={pr} /><code>{pr.sha.slice(0, 8)}</code>
        </div>
        <p class="review-muted review-inspector-summary">{pr.review}</p>
        {#if pr.kind === "pull-request"}<Button
            variant="outline"
            size="sm"
            onclick={onOpen}
            ><Maximize2 size={14} aria-hidden="true" />Open PR view</Button
          >{/if}<ReviewFeedback {controller} /><ReviewChecks
          {controller}
          collapseGroups
        />
      </div>{/if}
  </AppShell.Sidebar.Body>
  <AppShell.Sidebar.Footer style="padding:0"
    ><div class="review-inspector-footer">
      <ReviewActions {controller} compact /><ReviewApprovals
        {controller}
        compact
      />
    </div></AppShell.Sidebar.Footer
  >
</AppShell.Sidebar>
