import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Component from "../../src/components/maintenance/MaintenanceStatus.svelte";
import Demo from "../ComponentDemo.svelte";
export default {
  title: "Maintenance/Components/Status log",
  component: Component,
} satisfies Meta<typeof Component>;
type Story = StoryObj<typeof Demo>;
export const RepositoryMessages: Story = {
  render: () => ({
    Component: Demo,
    props: { part: "status", scenario: "partial" },
  }),
};
export const Loading: Story = {
  render: () => ({
    Component: Demo,
    props: { part: "status", scenario: "loading" },
  }),
};
export const ConnectionFailure: Story = {
  render: () => ({
    Component: Demo,
    props: { part: "status", scenario: "read-error" },
  }),
};
