import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, within, userEvent, waitFor } from "storybook/test";
import Demo from "./review/ReviewDemo.svelte";
export default {
  title: "Maintenance/Repository branch actions",
  component: Demo,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Demo>;
type Story = StoryObj<typeof Demo>;
export const FilterViews: Story = {
  args: { workspace: false },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    await c.findByRole("heading", { name: "10 items in view" });
    await userEvent.click(
      c.getByRole("button", {
        name: "Filter default-branch Actions: All states",
      }),
    );
    await userEvent.click(await page.findByRole("option", { name: "Failed" }));
    await userEvent.keyboard("{Escape}");
    await c.findByRole("heading", { name: "2 items in view" });
    await userEvent.click(c.getByRole("button", { name: "Activity" }));
    await c.findAllByRole("button", {
      name: "View repository: lapismd/lapis-desktop",
    });
    const repositories = () =>
      [
        ...canvasElement.querySelectorAll<HTMLElement>(
          '.activity-entry-context button[aria-label^="View repository:"]',
        ),
      ].map((button) => button.getAttribute("aria-label"));
    await expect(
      repositories().every(
        (label) => label === "View repository: lapismd/lapis-desktop",
      ),
    ).toBe(true);
    await userEvent.click(
      c.getByRole("button", { name: "Filter default-branch Actions: Failed" }),
    );
    await userEvent.click(await page.findByRole("option", { name: "Pending" }));
    await userEvent.click(page.getByRole("option", { name: "Failed" }));
    await userEvent.keyboard("{Escape}");
    await c.findAllByRole("button", {
      name: "View repository: lapismd/mira-mde",
    });
    await waitFor(() =>
      expect(
        repositories().every(
          (label) => label === "View repository: lapismd/mira-mde",
        ),
      ).toBe(true),
    );
  },
};
