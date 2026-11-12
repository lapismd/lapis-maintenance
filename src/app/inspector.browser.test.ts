import { expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { mount, unmount } from "svelte";
import MaintenanceDemo from "../../catalog/MaintenanceDemo.svelte";
import "@lapismd/design-core/styles.css";
import "@lapismd/repository-ui/styles.css";
import "../styles/global.css";

it.each([910, 1800])(
  "replaces the open inspector from a real card click at %i pixels",
  async (width) => {
    await page.viewport(width, 988);
    const target = document.createElement("div");
    document.body.appendChild(target);
    const app = mount(MaintenanceDemo, { target });
    try {
      await page
        .getByRole("button", { name: /Open card: Notebook release/ })
        .click();
      const inspector = page.getByRole("complementary", {
        name: "Item inspector",
      });
      await expect.element(inspector).toBeVisible();
      await page.getByRole("button", { name: /Open card: Desktop CI/ }).click();
      await expect.element(inspector).toBeVisible();
      await vi.waitFor(() =>
        expect(
          inspector.element().querySelector(".maintenance-detail-heading h2")
            ?.textContent,
        ).toBe("Desktop CI · package acceptance"),
      );
      expect(
        target
          .querySelector("[data-shell-root]")
          ?.getAttribute("data-right-sidebar-state"),
      ).toBe("expanded");
    } finally {
      await unmount(app);
      target.remove();
      await page.viewport(1280, 900);
    }
  },
);

it("keeps the inspector resize rail transparent on hover and keyboard resize", async () => {
  await page.viewport(1800, 988);
  const target = document.createElement("div");
  document.body.appendChild(target);
  const app = mount(MaintenanceDemo, { target });
  try {
    await page
      .getByRole("button", { name: /Open card: Notebook release/ })
      .click();
    const handle = page.getByRole("slider", { name: "Resize right sidebar" });
    await expect.element(handle).toBeVisible();
    const element = handle.element();
    const indicator = element.querySelector(
      '[data-ui-part="sidebar-resize-indicator"]',
    )!;
    await handle.hover();
    expect(getComputedStyle(indicator).backgroundColor).toBe(
      "rgba(0, 0, 0, 0)",
    );
    element.focus();
    const previous = Number(element.getAttribute("aria-valuenow"));
    await userEvent.keyboard("{ArrowLeft}");
    await vi.waitFor(() =>
      expect(Number(element.getAttribute("aria-valuenow"))).not.toBe(previous),
    );
    expect(getComputedStyle(indicator).backgroundColor).toBe(
      "rgba(0, 0, 0, 0)",
    );
  } finally {
    await unmount(app);
    target.remove();
    await page.viewport(1280, 900);
  }
});
