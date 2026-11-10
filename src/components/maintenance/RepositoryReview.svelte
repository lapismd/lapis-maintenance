<script lang="ts">
  import { untrack } from "svelte";
  import {
    RepositoryPullRequest,
    RepositoryPullRequestReview,
    type PullRequestRequest,
    type RepositoryPullRequestRecord,
  } from "@lapismd/repository-ui/jj";
  import { checkSnapshot } from "../../maintenance/checks";
  import type { ActionKind, MaintenanceDetail } from "../../maintenance/types";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  let {
    detail,
    controller,
    onClose,
    context,
  }: {
    detail: MaintenanceDetail;
    controller: MaintenanceController;
    onClose: () => void;
    context?: MaintenanceDetail;
  } = $props();
  const review = new RepositoryPullRequestReview();
  const branch = $derived(detail.ref ?? `maintenance/${detail.item.id}`);
  $effect(() => {
    const value = detail,
      busy = controller.commands.busy || controller.detailLoading;
    untrack(() => {
      const allowed = (kind: ActionKind) =>
        value.item.actions.some((a) => a.kind === kind && a.available) &&
        !controller.commands.blocked(value.item, kind) &&
        (kind !== "merge-pr" ||
          (checkSnapshot(value).complete &&
            value.checks.length > 0 &&
            value.checks.every((check) => check.state === "passed") &&
            !["blocked", "draft"].includes(value.item.status)));
      const record: RepositoryPullRequestRecord = {
        id: value.item.id,
        number: value.item.number ?? 1,
        provider: "github",
        head: branch,
        base: value.baseRef ?? "main",
        sha: value.item.target.sha,
        title: value.item.title,
        body: value.description,
        url: value.item.url,
        state: "open",
        draft: value.item.draft ?? value.item.status === "draft",
        mergeable: value.mergeable,
        mergeMethods: value.mergeMethods ?? ["squash"],
        capabilities: [
          "checks",
          "refresh",
          ...(allowed("merge-pr") ? ["merge" as const] : []),
        ],
        details: [
          ...(context?.workflow
            ? [{ label: "Workflow", value: context.workflow }]
            : []),
          ...(context?.environment
            ? [{ label: "Environment", value: context.environment }]
            : []),
          ...value.item.actions
            .filter((action) => action.kind === "merge-pr" && action.reason)
            .map((action) => ({
              label: "Merge eligibility",
              value: action.reason!,
            })),
          { label: "Repository", value: value.item.repository },
          {
            label: "Review",
            value: value.review ?? "Review state unavailable",
          },
        ],
        checks: checkSnapshot(value),
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
      void controller.select(detail.item.id, true);
    else if (value.action.kind === "merge")
      controller.commands.prepare(detail.item, "merge-pr", {
        mergeMethod: value.action.method,
      });
  }
</script>

<RepositoryPullRequest {review} {branch} onAction={request} {onClose} />
