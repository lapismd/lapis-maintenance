import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Component from "../../src/components/maintenance/MaintenanceDetails.svelte";
import Demo from "../ComponentDemo.svelte";
export default {
  title: "Maintenance/Components/Details",
  component: Component,
  parameters: {
    docs: {
      description: {
        component:
          "Production details used by MaintenanceScreen. The catalog host supplies a disposable controller and simulated ports.",
      },
    },
  },
} satisfies Meta<typeof Component>;
type Story = StoryObj<typeof Demo>;
export const Workflow: Story = {
  render: () => ({ Component: Demo, props: { part: "details" } }),
};
export const PullRequest: Story = {
  render: () => ({
    Component: Demo,
    props: { part: "details", selected: "registry" },
  }),
};
export const Approval: Story = {
  render: () => ({
    Component: Demo,
    props: { part: "details", selected: "approval" },
  }),
};
