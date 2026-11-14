import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Component from "../../src/components/maintenance-review/ReviewInspector.svelte";
import Demo from "../review/ReviewDemo.svelte";
export default {
  title: "Maintenance/Review components/Inspector",
  component: Component,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The joined inspector in its owning AppShell. Open PR view moves into the main workspace.",
      },
    },
  },
} satisfies Meta<typeof Component>;
type Story = StoryObj<typeof Demo>;
const render: Story["render"] = (args) => ({
  Component: Demo,
  props: { ...args, workspace: false },
});
export const PullRequest: Story = { render };
export const WorkflowApproval: Story = {
  render,
  args: { scenario: "workflow-approval", selected: "compatibility" },
};
export const EnvironmentApproval: Story = {
  render,
  args: { scenario: "environment-approval" },
};
