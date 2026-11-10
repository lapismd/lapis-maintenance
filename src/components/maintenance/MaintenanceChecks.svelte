<script lang="ts">
  import { RepositoryChecks } from "@lapismd/repository-ui/jj";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  import type { MaintenanceDetail } from "../../maintenance/types";
  import { checkSnapshot } from "../../maintenance/checks";
  let {
    detail,
    controller,
  }: { detail: MaintenanceDetail; controller: MaintenanceController } =
    $props();
</script>

<RepositoryChecks
  checks={checkSnapshot(detail)}
  currentSha={detail.item.target.sha}
  disabled={controller.detailLoading || controller.commands.busy}
  onRefresh={() => {
    void controller.select(detail.item.id, true);
  }}
/>
