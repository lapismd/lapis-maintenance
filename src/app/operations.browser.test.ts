import { expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { mount, unmount } from "svelte";
import MaintenanceScreen from "../components/maintenance/MaintenanceScreen.svelte";
import { MaintenanceController } from "../maintenance/controller.svelte";
import { operatorFixture } from "../../catalog/operations/fixtures";
import "@lapismd/design-core/styles.css";
import "@lapismd/repository-ui/styles.css";
import "../styles/global.css";
it("navigates to operator evidence and submits each eligible batch target once", async () => {
  const snapshot = operatorFixture();
  snapshot.coordinator = {
    state: "unavailable",
    reason: "Coordinator unavailable; manual controls remain available.",
  };
  const read = {
    readCoordinatorReport: vi.fn(async () => ({
      state: "unavailable" as const,
      reason: "Coordinator unavailable; manual controls remain available.",
    })),
    readSnapshot: async () => snapshot,
    refreshRepository: async () => snapshot,
    readDetails: vi.fn(),
  };
  const execute = vi.fn().mockResolvedValue({
    status: "accepted",
    message: "Simulated eligible rerun.",
  });
  const controller = new MaintenanceController(read, { execute });
  const target = document.createElement("div");
  document.body.appendChild(target);
  const app = mount(MaintenanceScreen, {
    target,
    props: {
      controller,
      profile: {
        principal: "fixture",
        revision: 0,
        details: {
          display_name: "Fixture",
          description: "",
          avatar: null,
          email: null,
          gravatar: false,
        },
      },
      dark: false,
      onToggleTheme: () => {},
      onConnect: () => {},
    },
  });
  try {
    await controller.refresh();
    expect(read.readCoordinatorReport).not.toHaveBeenCalled();
    await page.getByRole("button", { name: "Operations", exact: true }).click();
    await vi.waitFor(() =>
      expect(read.readCoordinatorReport).toHaveBeenCalledOnce(),
    );
    await expect
      .element(
        page.getByRole("heading", {
          name: "Dependency and release operations",
        }),
      )
      .toBeVisible();
    await expect
      .element(
        page.getByRole("link", {
          name: /Review major framework compatibility/,
        }),
      )
      .toHaveAttribute(
        "href",
        "https://github.com/example/compatibility/issues/19",
      );
    await page.getByRole("button", { name: "Rerun eligible failures" }).click();
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
    await vi.waitFor(() => expect(execute).toHaveBeenCalledTimes(2));
    expect(controller.commands.receipts.map((r) => r.status)).toEqual([
      "accepted",
      "accepted",
    ]);
  } finally {
    controller.dispose();
    await unmount(app);
    target.remove();
  }
});
