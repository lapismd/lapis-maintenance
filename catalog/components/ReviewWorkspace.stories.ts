import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Component from "../../src/components/maintenance-review/ReviewWorkspace.svelte";
import Demo from "../review/ReviewDemo.svelte";
export default {
  title: "Maintenance/Review components/Workspace",
  component: Component,
} satisfies Meta<typeof Component>;
type Story = StoryObj<typeof Demo>;
const render: Story["render"] = (args) => ({
  Component: Demo,
  props: { ...args, part: "workspace" },
});
export const Overview: Story = { render };
export const Checks: Story = { render, args: { tab: "checks" } };
export const Activity: Story = { render, args: { tab: "activity" } };
