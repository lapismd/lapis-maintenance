import { expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { mount, unmount } from "svelte";
import { MaintenanceController } from "../maintenance/controller.svelte";
import OperationsPanel from "../components/maintenance-operations/OperationsPanel.svelte";
import { operatorFixture } from "../../catalog/operations/fixtures";
import { autocraftFixture } from "../../catalog/operations/autocraft-fixture";
import "@lapismd/design-core/styles.css";
import "@lapismd/repository-ui/styles.css";
import "../styles/global.css";
it("lazily shows immutable queue receipts without commands, retains manual controls after report failure, and clears on disconnect", async () => {
  const snapshot = operatorFixture(),
    execute = vi.fn(),
    readAutocraftReport = vi.fn(async () => autocraftFixture());
  const controller = new MaintenanceController(
    {
      readSnapshot: async () => snapshot,
      refreshRepository: async () => snapshot,
      readDetails: vi.fn(),
      readAutocraftReport,
    },
    { execute },
  );
  await controller.refresh();
  expect(readAutocraftReport).not.toHaveBeenCalled();
  controller.view = "operations";
  const target = document.createElement("div");
  document.body.appendChild(target);
  const app = mount(OperationsPanel, { target, props: { controller } });
  try {
    await expect.poll(() => readAutocraftReport.mock.calls.length).toBe(1);
    await userEvent.click(
      page.getByRole("button", { name: /example\/repair #148/ }),
    );
    await expect
      .element(
        page.getByText(
          "Focused regression: 1 failure before, 0 after. Full required lanes passed.",
        ),
      )
      .toBeVisible();
    await expect
      .element(page.getByRole("link", { name: "Open pull request #148" }))
      .toHaveAttribute("href", "https://github.com/example/repair/pull/148");
    expect(execute).not.toHaveBeenCalled();
    readAutocraftReport.mockRejectedValueOnce(Error("Fixture denied"));
    await controller.refresh(true);
    await expect
      .element(
        page.getByText(
          "AutoCraft report unavailable. Manual controls remain available.",
        ),
      )
      .toBeVisible();
    await expect
      .element(page.getByRole("region", { name: "Batch actions" }))
      .toBeVisible();
    expect(
      controller.snapshot?.items[0]?.actions.some((a) => a.available),
    ).toBe(true);
    expect(execute).not.toHaveBeenCalled();
    controller.disconnect();
    expect(controller.reports.autocraft.evidence).toBeNull();
  } finally {
    await unmount(app);
    controller.dispose();
    target.remove();
  }
});
