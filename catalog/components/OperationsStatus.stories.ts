import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Component from "../../src/components/maintenance-operations/OperationsStatus.svelte";
export default {
  title: "Maintenance/Components/Operations status",
  component: Component,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Component>;
type Story = StoryObj<typeof Component>;
export const Waiting: Story = { args: { status: "upstream-wait" } };
export const Held: Story = { args: { status: "held" } };
export const Failed: Story = { args: { status: "failed" } };
export const Published: Story = { args: { status: "published" } };
export const Running: Story = { args: { status: "admitted" } };
export const Unknown: Story = { args: { status: "unavailable" } };
