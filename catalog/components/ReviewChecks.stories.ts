import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Component from "../../src/components/maintenance-review/ReviewChecks.svelte";
import Demo from "../review/ReviewDemo.svelte";
export default {
  title: "Maintenance/Review components/Checks",
  component: Component,
} satisfies Meta<typeof Component>;
type Story = StoryObj<typeof Demo>;
const render: Story["render"] = (args) => ({
  Component: Demo,
  props: { ...args, part: "checks" },
});
export const Passed: Story = { render };
export const Failed: Story = { render, args: { scenario: "failed-checks" } };
export const Pending: Story = {
  render,
  args: { scenario: "workflow-approval", selected: "compatibility" },
};
export const NoChecks: Story = { render, args: { scenario: "empty" } };
export const Loading: Story = { render, args: { scenario: "loading" } };
