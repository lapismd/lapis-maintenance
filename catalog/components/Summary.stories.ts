import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Component from "../../src/components/maintenance/MaintenanceContext.svelte";
import Demo from "../ComponentDemo.svelte";
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
