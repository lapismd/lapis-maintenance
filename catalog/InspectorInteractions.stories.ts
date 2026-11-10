import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import MaintenanceDemo from "./MaintenanceDemo.svelte";
const meta = {
  title: "Maintenance/Inspector interactions",
  component: MaintenanceDemo,
} satisfies Meta<typeof MaintenanceDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const ReopenSelectedItem: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const card = await c.findByRole("button", {
      name: /Open card: Notebook release/,
    });
    await userEvent.click(card);
    await c.findByRole("button", { name: "Approve deployment" });
    await userEvent.click(
      c.getByRole("button", { name: /^(Collapse|Close) right sidebar$/ }),
    );
    await waitFor(() =>
      expect(
        c.getByRole("button", { name: /^(Open|Expand) right sidebar$/ }),
      ).toBeVisible(),
    );
    await userEvent.click(card);
    await expect(
      await c.findByRole("button", {
        name: /^(Collapse|Close) right sidebar$/,
      }),
    ).toBeVisible();
    await expect(
      await c.findByRole("button", { name: "Approve deployment" }),
    ).toBeVisible();
  },
};
