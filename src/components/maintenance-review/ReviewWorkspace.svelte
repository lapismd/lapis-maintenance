<script lang="ts">
  import * as Tabs from "@lapismd/design-core/shadcn/tabs";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import {
    GitPullRequest,
    CircleCheck,
    Activity,
    Files,
    ExternalLink,
    Bot,
    GitBranch,
  } from "@lucide/svelte";
  import ReviewOverview from "./ReviewOverview.svelte";
  import ReviewChecks from "./ReviewChecks.svelte";
  import ReviewActivity from "./ReviewActivity.svelte";
  import ReviewActions from "./ReviewActions.svelte";
  import ReviewFeedback from "./ReviewFeedback.svelte";
  import type { ReviewController } from "../../maintenance/review/controller.svelte";
  import type { ReviewTab } from "../../maintenance/review/types";
  import "./review.css";
  import "./workspace.css";
  let { controller }: { controller: ReviewController } = $props();
  const pr = $derived(controller.overview);
</script>

<section class="review-workspace" aria-label="Pull request workspace">
  {#if pr}
    <header class="review-workspace-heading">
      <div class="review-workspace-title">
        <h1>{pr.title} <span class="review-pr-number">#{pr.number}</span></h1>
        <ReviewActions {controller} />
      </div>
      <div class="review-workspace-meta">
        <Bot size={14} aria-hidden="true" /><span>{pr.author}</span><span
          >opened this pull request</span
        ><GitBranch size={14} aria-hidden="true" /><code>{pr.head}</code><span
          >→</span
        ><code>{pr.base}</code><span class="review-additions"
          >+{pr.additions}</span
        ><span class="review-deletions">−{pr.deletions}</span>
        <a
          class="review-external"
          href={`${pr.url}/files`}
          target="_blank"
          rel="noopener noreferrer"
          ><Files size={14} aria-hidden="true" />Files on GitHub<ExternalLink
            size={12}
            aria-hidden="true"
          /></a
        >
      </div>
    </header>
    <ReviewFeedback {controller} />
    <Tabs.Root
      value={controller.tab}
      onValueChange={(value) => controller.setTab(value as ReviewTab)}
      class="review-workspace-tabs"
    >
      <Tabs.List class="review-tabs-list" aria-label="Pull request sections"
        ><Tabs.Trigger value="overview"
          ><GitPullRequest size={14} aria-hidden="true" />Overview</Tabs.Trigger
        ><Tabs.Trigger value="checks"
          ><CircleCheck size={14} aria-hidden="true" />Checks<Badge
            variant="secondary"
            >{controller.resources.checks.data?.length ?? 0}</Badge
          ></Tabs.Trigger
        ><Tabs.Trigger value="activity"
          ><Activity size={14} aria-hidden="true" />Activity</Tabs.Trigger
        ></Tabs.List
      >
      <Tabs.Content value="overview" class="review-tab-content"
        ><ReviewOverview {controller} /></Tabs.Content
      >
      <Tabs.Content value="checks" class="review-tab-content"
        ><div class="review-check-tab">
          <ReviewChecks {controller} />
        </div></Tabs.Content
      >
      <Tabs.Content value="activity" class="review-tab-content"
        ><ReviewActivity {controller} /></Tabs.Content
      >
    </Tabs.Root>
  {/if}
</section>
