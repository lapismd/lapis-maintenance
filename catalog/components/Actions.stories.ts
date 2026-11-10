import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Component from "../../src/components/maintenance/MaintenanceActions.svelte";
import Demo from "../ComponentDemo.svelte";
export default {
  title: "Maintenance/Components/Actions",
  component: Component,
  parameters: {
    docs: {
      description: {
        component:
          "Production actions used by MaintenanceScreen. The catalog host supplies a disposable controller and simulated ports.",
      },
    },
  },
} satisfies Meta<typeof Component>;
type Story = StoryObj<typeof Demo>;
export const Workflow: Story = {
  render: () => ({ Component: Demo, props: { part: "actions" } }),
};
export const ReadOnly: Story = {
  render: () => ({
    Component: Demo,
    props: { part: "actions", scenario: "permissions" },
  }),
};
export const PullRequest: Story = {
  render: () => ({
    Component: Demo,
    props: { part: "actions", selected: "registry" },
  }),
};
