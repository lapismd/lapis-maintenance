import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Component from "../../src/components/maintenance-review/ReviewInputDialog.svelte";
import Demo from "../review/ReviewDemo.svelte";
export default {
  title: "Maintenance/Review components/Review inputs",
  component: Component,
} satisfies Meta<typeof Component>;
type Story = StoryObj<typeof Demo>;
export const Comment: Story = {
  render: () => ({ Component: Demo, props: { part: "confirmation" } }),
};
