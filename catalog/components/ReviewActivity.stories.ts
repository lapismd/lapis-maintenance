import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Component from "../../src/components/maintenance-review/ReviewActivity.svelte";
import Demo from "../review/ReviewDemo.svelte";
export default {
  title: "Maintenance/Review components/Activity",
  component: Component,
} satisfies Meta<typeof Component>;
type Story = StoryObj<typeof Demo>;
const render: Story["render"] = (args) => ({
  Component: Demo,
  props: { ...args, part: "activity" },
});
export const Timeline: Story = { render };
export const Empty: Story = { render, args: { scenario: "empty" } };
export const Unavailable: Story = {
  render,
  args: { scenario: "resource-error" },
};
export const Loading: Story = { render, args: { scenario: "loading" } };
