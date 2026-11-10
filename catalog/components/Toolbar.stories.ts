import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Component from "../../src/components/maintenance/MaintenanceToolbar.svelte";
import Demo from "../ComponentDemo.svelte";
import { expect, userEvent, waitFor, within } from "storybook/test";
export default {
  title: "Maintenance/Components/Toolbar",
  component: Component,
  parameters: {
    docs: {
      description: {
        component:
          "Production toolbar used by MaintenanceScreen. The catalog host supplies a disposable controller and simulated ports.",
      },
    },
  },
} satisfies Meta<typeof Component>;
type Story = StoryObj<typeof Demo>;
export const Connected: Story = {
  render: () => ({ Component: Demo, props: { part: "toolbar" } }),
};
export const Disconnected: Story = {
  render: () => ({
    Component: Demo,
    props: { part: "toolbar", scenario: "disconnected" },
  }),
};
export const StatusLog: Story = {
  render: () => ({
    Component: Demo,
    props: { part: "toolbar", scenario: "partial" },
  }),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    const trigger = await c.findByRole("button", {
      name: /Open status log:.*cannot access/,
    });
    await expect(trigger).toBeVisible();
    await userEvent.click(trigger);
    const log = await page.findByRole("region", { name: "Status log" });
    await waitFor(() =>
      expect(
        within(log).getByText(/cannot access this resource owner/),
      ).toBeVisible(),
    );
    await expect(within(log).getByRole("list")).toBeVisible();
    await userEvent.keyboard("{Escape}");
  },
};
