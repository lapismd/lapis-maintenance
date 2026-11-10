import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Component from "../../src/components/maintenance/MaintenanceNavigation.svelte";
import Demo from "../ComponentDemo.svelte";
import { expect, within } from "storybook/test";
export default {
  title: "Maintenance/Components/Navigation",
  component: Component,
  parameters: {
    docs: {
      description: {
        component:
          "Production navigation used by MaintenanceScreen. The catalog host supplies a disposable controller and simulated ports.",
      },
    },
  },
} satisfies Meta<typeof Component>;
type Story = StoryObj<typeof Demo>;
export const Expanded: Story = {
  render: () => ({ Component: Demo, props: { part: "navigation" } }),
};
export const Collapsed: Story = {
  render: () => ({
    Component: Demo,
    props: { part: "navigation", compact: true },
  }),
};
export const LongRepository: Story = {
  render: () => ({
    Component: Demo,
    props: { part: "navigation", scenario: "long-repositories" },
  }),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", {
      name: "Show lapismd/storybook-addon-visual-delta",
    });
    const label = button.querySelector("span")!;
    expect(getComputedStyle(label).textOverflow).toBe("ellipsis");
    expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
    expect(label.getBoundingClientRect().right).toBeLessThanOrEqual(
      button.getBoundingClientRect().right,
    );
  },
};
