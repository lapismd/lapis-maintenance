import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Component from "../../src/components/maintenance-review/ReviewOverview.svelte";
import Demo from "../review/ReviewDemo.svelte";
export default {
  title: "Maintenance/Review components/Overview",
  component: Component,
} satisfies Meta<typeof Component>;
type Story = StoryObj<typeof Demo>;
const render: Story["render"] = (args) => ({
  Component: Demo,
  props: { ...args, part: "overview" },
});
export const Default: Story = { render };
export const WorkflowApproval: Story = {
  render,
  args: { scenario: "workflow-approval", selected: "compatibility" },
};
export const ReadOnly: Story = {
  render,
  args: { scenario: "permission-denied" },
};
