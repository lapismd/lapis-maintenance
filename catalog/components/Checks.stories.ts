import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Component from "../../src/components/maintenance/MaintenanceRunPanel.svelte";
import Demo from "../ComponentDemo.svelte";
export default {
  title: "Maintenance/Components/Checks",
  component: Component,
  parameters: {
    docs: {
      description: {
        component:
          "Production checks used by MaintenanceScreen. The catalog host supplies a disposable controller and simulated ports.",
      },
    },
  },
} satisfies Meta<typeof Component>;
type Story = StoryObj<typeof Demo>;
export const Failed: Story = {
  render: () => ({ Component: Demo, props: { part: "run-panel" } }),
};
export const Passed: Story = {
  render: () => ({
    Component: Demo,
    props: { part: "run-panel", scenario: "passed-workflow" },
  }),
};
export const Approval: Story = {
  render: () => ({
    Component: Demo,
    props: { part: "run-panel", selected: "approval" },
  }),
};
