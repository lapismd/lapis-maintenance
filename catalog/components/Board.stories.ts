import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Component from "../../src/components/maintenance/MaintenanceBoard.svelte";
import Demo from "../ComponentDemo.svelte";
export default {
  title: "Maintenance/Components/Board",
  component: Component,
  parameters: {
    docs: {
      description: {
        component:
          "Production board used by MaintenanceScreen. The catalog host supplies a disposable controller and simulated ports.",
      },
    },
  },
} satisfies Meta<typeof Component>;
type Story = StoryObj<typeof Demo>;
export const Kanban: Story = {
  render: () => ({ Component: Demo, props: { part: "board" } }),
};
export const Activity: Story = {
  render: () => ({
    Component: Demo,
    props: { part: "board", view: "activity" },
  }),
};
export const Empty: Story = {
  render: () => ({
    Component: Demo,
    props: { part: "board", scenario: "empty" },
  }),
};
