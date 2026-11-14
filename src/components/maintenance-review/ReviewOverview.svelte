<script lang="ts">
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import {
    CircleCheck,
    GitBranch,
    GitCommitHorizontal,
    ListChecks,
  } from "@lucide/svelte";
  import GitHubIcon from "../maintenance/GitHubIcon.svelte";
  import ReviewResource from "./ReviewResource.svelte";
  import ReviewApprovals from "./ReviewApprovals.svelte";
  import type { ReviewController } from "../../maintenance/review/controller.svelte";
  import "./review.css";
  let { controller }: { controller: ReviewController } = $props();
  const pr = $derived(controller.overview);
</script>

<ReviewResource
  state={controller.resources.overview}
  label="Overview"
  onRetry={() => controller.load("overview", undefined, true)}
>
  {#if pr}<div class="review-overview-grid">
      <div class="review-overview-main">
        <article class="review-card review-description">
          <header class="review-section-heading">
            <h2>About this pull request</h2>
          </header>
          <div class="review-description-content">
            <p>{pr.description}</p>
            <div class="review-description-note">
              <CircleCheck size={16} aria-hidden="true" /><span
                >Changes are scoped to the displayed commit. Repository rules
                remain authoritative.</span
              >
            </div>
          </div>
        </article>
        <div class="review-card review-status-card">
          <CircleCheck size={20} aria-hidden="true" />
          <div>
            <strong
              >{controller.resources.checks.data?.every(
                (check) => check.state === "passed",
              ) && controller.resources.checks.data.length
                ? "Current checks have passed"
                : "Current checks need attention"}</strong
            >
            <p class="review-muted">{pr.review}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onclick={() => controller.setTab("checks")}
            ><ListChecks size={15} aria-hidden="true" />View checks</Button
          >
        </div>
      </div>
      <div class="review-overview-aside">
        <section class="review-card">
          <header class="review-section-heading">
            <GitBranch size={16} aria-hidden="true" />
            <h2>Pull request details</h2>
            <a
              class="maintenance-icon-link review-card-header-link"
              href={pr.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open pull request on GitHub"
              title="Open pull request on GitHub"><GitHubIcon /></a
            >
          </header>
          <dl class="review-metadata">
            <div>
              <dt>Repository</dt>
              <dd>{pr.repository}</dd>
            </div>
            <div>
              <dt>Author</dt>
              <dd>{pr.author}</dd>
            </div>
            <div>
              <dt>Branches</dt>
              <dd>
                <code>{pr.head}</code><span>→</span><code>{pr.base}</code>
              </dd>
            </div>
            <div>
              <dt>Revision</dt>
              <dd>
                <GitCommitHorizontal size={14} aria-hidden="true" /><code
                  >{pr.sha.slice(0, 12)}</code
                >
              </dd>
            </div>
            <div>
              <dt>Labels</dt>
              <dd>
                {#each pr.labels as label}<Badge variant="secondary"
                    >{label}</Badge
                  >{/each}
              </dd>
            </div>
            <div>
              <dt>Changes</dt>
              <dd>
                <span class="review-additions">+{pr.additions}</span><span
                  class="review-deletions">−{pr.deletions}</span
                >
              </dd>
            </div>
          </dl>
        </section>
        <ReviewApprovals {controller} />
      </div>
    </div>{/if}
</ReviewResource>
