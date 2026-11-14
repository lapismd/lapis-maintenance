<script lang="ts">
  import { onMount, untrack } from "svelte";
  import ReviewShell from "../../src/components/maintenance-review/ReviewShell.svelte";
  import ReviewWorkspace from "../../src/components/maintenance-review/ReviewWorkspace.svelte";
  import ReviewChecks from "../../src/components/maintenance-review/ReviewChecks.svelte";
  import ReviewApprovals from "../../src/components/maintenance-review/ReviewApprovals.svelte";
  import ReviewActivity from "../../src/components/maintenance-review/ReviewActivity.svelte";
  import ReviewFiles from "../../src/components/maintenance-review/ReviewFiles.svelte";
  import ReviewConfirmation from "../../src/components/maintenance-review/ReviewConfirmation.svelte";
  import ReviewFeedback from "../../src/components/maintenance-review/ReviewFeedback.svelte";
  import ReviewOverview from "../../src/components/maintenance-review/ReviewOverview.svelte";
  import ReviewActions from "../../src/components/maintenance-review/ReviewActions.svelte";
  import { ReviewController } from "../../src/maintenance/review/controller.svelte";
  import { MaintenanceController } from "../../src/maintenance/controller.svelte";
  import { MemoryMaintenancePort } from "../memory-port";
  import { MemoryReviewPort } from "./memory-port";
  import type { ReviewScenario } from "./fixtures";
  import type { ReviewTab } from "../../src/maintenance/review/types";
  import "../../src/components/maintenance-review/workspace.css";
  let {
    part = "shell",
    scenario = "ready",
    selected = "registry",
    tab = "overview",
    workspace = true,
    theme = "light",
    width,
    file,
  }: {
    part?:
      | "shell"
      | "workspace"
      | "checks"
      | "approvals"
      | "activity"
      | "files"
      | "confirmation"
      | "overview"
      | "actions";
    scenario?: ReviewScenario;
    selected?: string;
    tab?: ReviewTab;
    workspace?: boolean;
    theme?: "light" | "dark";
    width?: number;
    file?: string;
  } = $props();
  const port = untrack(() => new MemoryReviewPort(scenario));
  const review = untrack(
    () => new ReviewController(port.summaries, port, port),
  );
  const inboxPort = new MemoryMaintenancePort("populated", 0);
  if (untrack(() => scenario === "workflow-approval")) {
    const item = inboxPort.snapshot.items.find(
      (item) => item.id === "compatibility",
    )!;
    item.status = "approval-wait";
    item.draft = false;
  }
  const inbox = new MaintenanceController(inboxPort, inboxPort);
  const profile = {
    principal: "demo-maintainer",
    revision: 0,
    details: {
      display_name: "Demo maintainer",
      description: "UI preview",
      avatar: null,
      email: null,
      gravatar: false,
    },
  };
  let dark = $state(untrack(() => theme === "dark"));
  $effect(() => {
    document.documentElement.classList.toggle("dark", dark);
  });
  onMount(() => {
    void inbox.refresh().then(() => inbox.select(selected));
    const selecting = review.select(selected);
    review.setTab(
      part === "files" || part === "activity" || part === "checks" ? part : tab,
    );
    review.workspaceOpen = workspace;
    void selecting.then(async () => {
      if (scenario === "refreshing") void review.refresh();
      if (file) {
        if (!review.resources.files.data) await review.load("files");
        await review.selectFile(file);
      }
      if (part === "confirmation")
        review.prepare(
          "approve-environment",
          "production",
          "Approve environment",
        );
    });
    return () => {
      review.dispose();
      inbox.dispose();
      document.documentElement.classList.remove("dark");
    };
  });
</script>

<div
  class="maintenance-app review-ui"
  data-ui-theme="lapis"
  style:width={width ? `${width}px` : "100%"}
  style:max-width="100%"
>
  {#if part === "shell"}<ReviewShell
      {inbox}
      {review}
      {profile}
      {dark}
      onToggleTheme={() => (dark = !dark)}
    />
  {:else if part === "workspace"}<ReviewWorkspace
      controller={review}
    /><ReviewConfirmation controller={review} />
  {:else}<div
      class="review-component-surface"
      class:review-component-files={part === "files"}
    >
      <ReviewFeedback controller={review} />
      {#if part === "checks"}<ReviewChecks
          controller={review}
        />{:else if part === "approvals" || part === "confirmation"}<ReviewApprovals
          controller={review}
        />{:else if part === "activity"}<ReviewActivity
          controller={review}
        />{:else if part === "files"}<ReviewFiles
          controller={review}
        />{:else if part === "overview"}<ReviewOverview
          controller={review}
        />{:else if part === "actions"}<ReviewActions
          controller={review}
        /><ReviewChecks controller={review} />{/if}
      <ReviewConfirmation controller={review} />
    </div>{/if}
</div>
