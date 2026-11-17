<script lang="ts">
  import FeedbackFeed from "../feedback/FeedbackFeed.svelte";
  import { outcomeSeverity } from "../../maintenance/feedback.svelte";
  import type { DispatchController } from "../../maintenance/dispatch/controller.svelte";
  let { controller, live }: { controller: DispatchController; live: boolean } =
    $props();
</script>

<FeedbackFeed
  scope="workflow-dispatch"
  pending={controller.loading || controller.pending}
  notices={[
    ...(controller.error
      ? [
          {
            id: `dispatch:${controller.repository}:${controller.requestId}:error`,
            title: "Could not run workflow",
            message: controller.error,
            severity: "error" as const,
          },
        ]
      : []),
    ...(controller.result
      ? [
          {
            id: `command:${controller.requestId}`,
            title: `${live ? "GitHub" : "Preview"} · ${controller.result.status}`,
            message: controller.result.message,
            severity: outcomeSeverity(controller.result.status),
          },
        ]
      : []),
    ...controller.warnings.map((message) => ({
      id: `dispatch:${controller.repository}:warning:${message}`,
      title: "Workflow discovery incomplete",
      message,
      severity: "warning" as const,
    })),
  ]}
/>
