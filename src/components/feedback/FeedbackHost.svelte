<script lang="ts">
  import { NotificationToasts } from "@lapismd/design-core/workspace/plugins/notifications";
  import type { FeedbackCenter } from "../../maintenance/feedback.svelte";
  let { center }: { center: FeedbackCenter } = $props();
</script>

<NotificationToasts
  records={center.records}
  portal
  onDismiss={(id) => center.dismiss(id)}
  onAction={(id) => center.activate(id)}
  onPause={(id) => center.pause(id)}
  onResume={(id) => center.resume(id)}
/>
