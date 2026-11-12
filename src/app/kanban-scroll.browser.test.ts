import { expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { mount, unmount } from "svelte";
import MaintenanceScreen from "../components/maintenance/MaintenanceScreen.svelte";
import { MaintenanceController } from "../maintenance/controller.svelte";
import { MemoryMaintenancePort } from "../../catalog/memory-port";
import "@lapismd/design-core/styles.css";
import "@lapismd/repository-ui/styles.css";
import "../styles/global.css";

it("retains wide-board headers when opening a card deep in the Activity column", async () => {
  await page.viewport(1800, 1080);
  const port = new MemoryMaintenancePort("populated", 0);
  const run = port.snapshot.items.find((item) => item.id === "running")!;
  port.snapshot.items.push(
    ...Array.from({ length: 100 }, (_, index) => ({
      ...structuredClone(run),
      id: `activity-${index}`,
      title: `Activity fixture ${index}`,
      status: "passed" as const,
    })),
  );
  const controller = new MaintenanceController(port, port);
  await controller.refresh();
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
      onConnect() {},
      onToggleTheme() {},
    },
  });
  try {
    await page.getByRole("button", { name: /^Expand \d+ Activity$/ }).click();
    const activity = Array.from(
      target.querySelectorAll<HTMLElement>(
        '[data-ui-component="kanban-column"]',
      ),
    ).find((column) => column.textContent?.includes("Activity fixture 75"))!;
    const board = target.querySelector<HTMLElement>(
      '[data-ui-component="kanban-board"]',
    )!;
    const viewport = board.querySelector<HTMLElement>(
      '.board-scroll > [data-slot="scroll-area-viewport"]',
    )!;
    const header = activity.querySelector<HTMLElement>(
      '[data-ui-part="column-header"]',
    )!;
    await vi.waitFor(() => expect(activity.clientHeight).toBeGreaterThan(300));
    expect(viewport.scrollHeight).toBeLessThanOrEqual(
      viewport.clientHeight + 1,
    );
    await page
      .getByRole("button", { name: /^Open card: Activity fixture 75\./ })
      .click();
    await expect
      .element(page.getByRole("complementary", { name: "Item inspector" }))
      .toBeVisible();
    expect(viewport.scrollTop).toBe(0);
    expect(header.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      board.getBoundingClientRect().top,
    );
    await expect
      .element(
        page.getByRole("heading", { name: "Activity fixture 75", exact: true }),
      )
      .toBeVisible();
  } finally {
    controller.dispose();
    await unmount(app);
    target.remove();
    await page.viewport(1280, 900);
  }
});
