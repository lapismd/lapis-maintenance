import { expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { mount, unmount } from "svelte";
import OperationsPanel from "../components/maintenance-operations/OperationsPanel.svelte";
import { MaintenanceController } from "../maintenance/controller.svelte";
import { scopedFixture } from "../../catalog/operations/scoped-fixture";
import "@lapismd/design-core/styles.css";
import "@lapismd/repository-ui/styles.css";
import "../styles/global.css";
it("renders selected SDK and escaped deferred work without executing commands", async () => {
  const snapshot = scopedFixture(),
    scope = snapshot.coordinator!.report!.nodes[0]!.scopedAdmission!;
  scope.deferredWaits = [
    {
      package: "@lapis-notes/app-profile",
      repository: "lapismd/lapis-notes",
      path: "package.json",
      reason:
        '<img src=x onerror="window.scopedWrite=true"> awaiting publication',
    },
  ];
  const execute = vi.fn(),
    controller = new MaintenanceController(
      {
        readSnapshot: async () => snapshot,
        refreshRepository: async () => snapshot,
        readDetails: vi.fn(),
      },
      { execute },
    );
  const target = document.createElement("div");
  document.body.appendChild(target);
  await controller.refresh();
  const app = mount(OperationsPanel, { target, props: { controller } });
  try {
    await page
      .getByRole("button", {
        name: /lapismd\/lapis-desktop SDK-only · Running compatible update/,
      })
      .click();
    await expect
      .element(
        page.getByRole("heading", {
          name: "SDK-only tooling update",
          exact: true,
        }),
      )
      .toBeVisible();
    await expect
      .element(
        page.getByRole("heading", {
          name: "Deferred package changes (1)",
          exact: true,
        }),
      )
      .toBeVisible();
    await expect
      .element(
        page.getByRole("heading", { name: "Deferred holds (4)", exact: true }),
      )
      .toBeVisible();
    await expect
      .element(
        page.getByRole("heading", {
          name: "Deferred upstream waits (1)",
          exact: true,
        }),
      )
      .toBeVisible();
    await expect
      .element(page.getByText(scope.deferredWaits[0]!.reason, { exact: false }))
      .toBeVisible();
    expect(target.querySelector('img[src="x"]')).toBeNull();
    expect(execute).not.toHaveBeenCalled();
    controller.query = "unavailable registry";
    await expect
      .element(
        page
          .getByRole("button", { name: /lapismd\/lapis-desktop SDK-only/ })
          .first(),
      )
      .toBeVisible();
    await expect
      .element(page.getByRole("button", { name: "Rerun eligible failures" }))
      .toBeDisabled();
  } finally {
    controller.dispose();
    await unmount(app);
    target.remove();
  }
});
