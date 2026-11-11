import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import MaintenanceDemo from "./MaintenanceDemo.svelte";

export default {
  title: "Maintenance/Responsive reads",
  component: MaintenanceDemo,
} satisfies Meta<typeof MaintenanceDemo>;
type Story = StoryObj<typeof MaintenanceDemo>;
async function openPull(canvasElement: HTMLElement) {
  const c = within(canvasElement);
  await c.findByRole("button", { name: /Open card: Notebook release/ });
  await userEvent.type(
    c.getByRole("textbox", { name: "Search maintenance items" }),
    "Publish approved registry",
  );
  await userEvent.click(
    await c.findByRole("button", {
      name: /Open card: Publish approved registry/,
    }),
  );
  await expect(await c.findByText("All checks have passed")).toBeVisible();
  return c;
}
export const CachedDetails: Story = {
  args: { scenario: "cached-details" },
  play: async ({ canvasElement }) => {
    const c = await openPull(canvasElement);
    await expect(
      c.getByText("Showing cached details · Refreshing…"),
    ).toBeVisible();
    await expect(c.getByRole("button", { name: "Approve PR" })).toBeDisabled();
    await expect(
      c.getByRole("button", { name: "Squash and merge" }),
    ).toBeDisabled();
  },
};
export const FailedRefresh: Story = {
  args: { scenario: "detail-refresh-error" },
  play: async ({ canvasElement }) => {
    const c = await openPull(canvasElement);
    await expect(
      await c.findByText(/Could not refresh details. Showing cached data/),
    ).toBeVisible();
    await expect(c.getByRole("button", { name: "Approve PR" })).toBeDisabled();
    await userEvent.click(c.getByRole("button", { name: "Retry details" }));
    await waitFor(() =>
      expect(c.getByRole("button", { name: "Approve PR" })).toBeEnabled(),
    );
    await expect(c.getByText("All checks have passed")).toBeVisible();
  },
};
async function inspectHeader(canvasElement: HTMLElement) {
  const c = within(canvasElement);
  const status = await c.findByRole("button", {
    name: /Open status log:.*cannot access/,
  });
  await expect(status).toBeVisible();
  const row = status.closest(".maintenance-toolbar-row")!;
  const breadcrumb = row.querySelector(".maintenance-breadcrumb")!;
  const bounds = row.getBoundingClientRect();
  await expect(breadcrumb.getBoundingClientRect().width).toBeLessThanOrEqual(
    96,
  );
  await expect(status.getBoundingClientRect().width).toBeGreaterThanOrEqual(
    110,
  );
  await expect(status.getBoundingClientRect().right).toBeLessThanOrEqual(
    bounds.right,
  );
  const time = row.querySelector(".maintenance-freshness")!;
  await expect(time).toHaveTextContent(/^\d{2}:\d{2} UTC$/);
  await userEvent.click(status);
  const log = await within(canvasElement.ownerDocument.body).findByRole(
    "region",
    { name: "Status log" },
  );
  await waitFor(() => expect(log).toBeVisible());
  await userEvent.keyboard("{Escape}");
}
export const CompactHeader: Story = {
  args: { width: 390, scenario: "partial" },
  play: async ({ canvasElement }) => inspectHeader(canvasElement),
};
export const NarrowDesktopHeader: Story = {
  args: { width: 1100, scenario: "partial" },
  play: async ({ canvasElement }) => {
    await inspectHeader(canvasElement);
    await expect(
      canvasElement.querySelector('[data-shell-root="true"]'),
    ).toHaveAttribute("data-display-mode", "desktop");
  },
};
