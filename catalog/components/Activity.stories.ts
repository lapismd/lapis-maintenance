import type { Meta, StoryObj } from "@storybook/svelte-vite";
import ActivityFeed from "../../src/components/maintenance-activity/ActivityFeed.svelte";
import Demo from "../activity/ActivityDemo.svelte";
export default {
  title: "Maintenance/Components/Activity",
  component: ActivityFeed,
} satisfies Meta<typeof ActivityFeed>;
type Story = StoryObj<typeof Demo>;
const render: Story["render"] = (args) => ({ Component: Demo, props: args });
export const Feed: Story = { render };
export const Entry: Story = { render, args: { part: "entry" } };
export const Empty: Story = { render, args: { scenario: "empty" } };
export const Error: Story = { render, args: { scenario: "error" } };

export const Success: Story = {
  render,
  args: { part: "entry", outcome: "success" },
};
export const Failure: Story = {
  render,
  args: { part: "entry", outcome: "failure" },
};
