import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Component from "../../src/components/maintenance/StatusFilter.svelte";
import Demo from "../ComponentDemo.svelte";
export default {
  title: "Maintenance/Components/Status filter",
  component: Component,
} satisfies Meta<typeof Component>;
type Story = StoryObj<typeof Demo>;
export const Multiple: Story = {
  render: () => ({ Component: Demo, props: { part: "status-filter" } }),
};
