import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Component from "../../src/components/maintenance/MaintenanceContext.svelte";
import Demo from "../ComponentDemo.svelte";
import { expect, within } from "storybook/test";
export default {
  title: "Maintenance/Components/Summary",
  component: Component,
  parameters: {
    docs: {
      description: {
        component:
          "Production summary used by MaintenanceScreen. The catalog host supplies a disposable controller and simulated ports.",
      },
    },
  },
} satisfies Meta<typeof Component>;
type Story = StoryObj<typeof Demo>;
export const Populated: Story = {
  render: () => ({ Component: Demo, props: { part: "summary" } }),
};
export const Disconnected: Story = {
  render: () => ({
    Component: Demo,
    props: { part: "summary", scenario: "disconnected" },
  }),
};
export const Constrained: Story = {
  render: () => ({ Component: Demo, props: { part: "summary", width: 320 } }),
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText("10");
    const summary = canvasElement.querySelector(
      '[aria-label="Repository summary"]',
    )!;
    const tiles = Array.from(summary.children, (tile) =>
      tile.getBoundingClientRect(),
    );
    await expect(new Set(tiles.map((tile) => tile.top)).size).toBe(1);
    await expect(tiles[3]!.right).toBeLessThanOrEqual(
      summary.getBoundingClientRect().right + 1,
    );
  },
};
