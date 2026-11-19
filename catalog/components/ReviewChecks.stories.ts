import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Component from "../../src/components/maintenance-review/ReviewChecks.svelte";
import Demo from "../review/ReviewDemo.svelte";
import { expect, within } from "storybook/test";
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
export const Running: Story = {
  render,
  args: { selected: "running" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await expect(await c.findByLabelText("Running check")).toBeVisible();
    await expect(await c.findByLabelText(/Elapsed 1m \d{2}s/)).toBeVisible();
    await expect(await c.findByLabelText("Duration 1m 12s")).toBeVisible();
  },
};
export const Pending: Story = {
  render,
  args: { scenario: "workflow-approval", selected: "compatibility" },
};
export const NoChecks: Story = { render, args: { scenario: "empty" } };
export const Loading: Story = { render, args: { scenario: "loading" } };
