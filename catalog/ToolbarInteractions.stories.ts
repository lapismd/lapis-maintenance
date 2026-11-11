import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import MaintenanceDemo from "./MaintenanceDemo.svelte";

export default {
  title: "Maintenance/Toolbar interactions",
  component: MaintenanceDemo,
} satisfies Meta<typeof MaintenanceDemo>;
type Story = StoryObj<typeof MaintenanceDemo>;

export const Mobile: Story = {
  args: { width: 390 },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await c.findByRole("button", { name: /Open card: Notebook release/ });
    const expand = await c.findByRole("button", {
      name: "Expand dashboard controls",
    });
    await expect(expand).toHaveAttribute("aria-expanded", "false");
    await expect(
      c.queryByRole("textbox", { name: "Search maintenance items" }),
    ).not.toBeInTheDocument();
    const board = c.getByRole("group", { name: /^Maintenance status board/ });
    const compactHeight = board.getBoundingClientRect().height;
    await expect(compactHeight).toBeGreaterThan(200);
    await userEvent.click(expand);
    const collapse = await c.findByRole("button", {
      name: "Collapse dashboard controls",
    });
    await expect(collapse).toHaveAttribute("aria-expanded", "true");
    await expect(board.getBoundingClientRect().height).toBeLessThan(
      compactHeight - 80,
    );
    await userEvent.type(
      c.getByRole("textbox", { name: "Search maintenance items" }),
      "Version first-party",
    );
    await userEvent.click(collapse);
    await expect(
      c.getByRole("button", { name: "Expand dashboard controls" }),
    ).toHaveAttribute("aria-expanded", "false");
    await expect(
      c.getByRole("heading", { name: "1 item in view" }),
    ).toBeVisible();
    await waitFor(() =>
      expect(board.getBoundingClientRect().height).toBeGreaterThanOrEqual(
        compactHeight - 2,
      ),
    );
    await userEvent.click(
      c.getByRole("button", { name: "Expand dashboard controls" }),
    );
    await expect(
      c.getByRole("textbox", { name: "Search maintenance items" }),
    ).toHaveValue("Version first-party");
    await userEvent.click(c.getByRole("button", { name: "Clear filters" }));
    await expect(
      c.getByRole("heading", { name: "10 items in view" }),
    ).toBeVisible();
    await userEvent.click(
      c.getByRole("button", { name: "Collapse dashboard controls" }),
    );
  },
};
