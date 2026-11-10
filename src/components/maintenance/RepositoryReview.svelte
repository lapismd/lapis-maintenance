<script lang="ts">
  import { untrack } from "svelte";
  import {
    RepositoryPullRequest,
    RepositoryPullRequestReview,
    type PullRequestRequest,
    type RepositoryPullRequestRecord,
  } from "@lapismd/repository-ui/jj";
  import type { ActionKind, MaintenanceDetail } from "../../maintenance/types";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  let {
    detail,
    controller,
    onClose,
  }: {
    detail: MaintenanceDetail;
    controller: MaintenanceController;
    onClose: () => void;
  } = $props();
  const review = new RepositoryPullRequestReview();
  const branch = $derived(`maintenance/${detail.item.id}`);
  $effect(() => {
    const value = detail,
      busy = controller.commands.busy;
    untrack(() => {
      const allowed = (kind: ActionKind) =>
        value.item.actions.some((a) => a.kind === kind && a.available) &&
        !controller.commands.blocked(value.item, kind);
      const record: RepositoryPullRequestRecord = {
        id: value.item.id,
        number: value.item.number ?? 1,
        provider: "github",
        head: branch,
        base: "main",
        sha: value.item.target.sha,
        title: value.item.title,
        body: value.description,
        url: value.item.url,
        state: "open",
        draft: value.item.status === "draft",
        mergeable: allowed("merge-pr"),
        mergeMethods: ["squash"],
        capabilities: ["checks", "refresh"],
        details: [
          { label: "Repository", value: value.item.repository },
          {
            label: "Review",
            value: value.review ?? "Review state unavailable",
          },
        ],
        checks: {
          sha: value.item.target.sha,
          complete: true,
          items: value.checks.map((check, i) => ({ id: String(i), ...check })),
        },
      };
      review.sync(
        {
          repository: value.item.repository,
          revision: 0,
          workspace: null,
          readKey: value.item.target.sha,
        },
        [record],
      );
      review.select(branch);
      review.busy = busy;
    });
  });
  function request(value: PullRequestRequest) {
    if (value.expectedSha !== detail.item.target.sha) return;
    if (value.action.kind === "refresh" || value.action.kind === "checks")
      void controller.select(detail.item.id);
  }
</script>

<RepositoryPullRequest {review} {branch} onAction={request} {onClose} />
