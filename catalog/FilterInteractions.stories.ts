import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import MaintenanceDemo from "./MaintenanceDemo.svelte";
const meta = {
  title: "Maintenance/Filter interactions",
  component: MaintenanceDemo,
} satisfies Meta<typeof MaintenanceDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const MultipleStatuses: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    await c.findByRole("heading", { name: "10 items in view" });
    await userEvent.click(c.getByRole("button", { name: /Filter statuses:/ }));
    await userEvent.click(
      await page.findByRole("option", { name: /^Failed$/ }),
    );
    await userEvent.click(
      page.getByRole("option", { name: /^Approval waiting$/ }),
    );
    await expect(
      page.getByRole("option", { name: /^Failed$/ }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("option", { name: /^Approval waiting$/ }),
    ).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(
        page.queryByRole("listbox", { name: "Statuses", hidden: true }),
      ).not.toBeInTheDocument(),
    );
    await expect(
      c.getByRole("heading", { name: "2 items in view" }),
    ).toBeVisible();
    await userEvent.click(c.getByRole("button", { name: "Clear filters" }));
    await expect(
      c.getByRole("heading", { name: "10 items in view" }),
    ).toBeVisible();
  },
};
