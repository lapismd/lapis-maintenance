import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Component from "../../src/components/maintenance/MaintenanceProfile.svelte";
import Demo from "../ComponentDemo.svelte";
export default {
  title: "Maintenance/Components/Profile",
  component: Component,
  parameters: {
    docs: {
      description: {
        component:
          "Production profile used by MaintenanceScreen. The catalog host supplies a disposable controller and simulated ports.",
      },
    },
  },
} satisfies Meta<typeof Component>;
type Story = StoryObj<typeof Demo>;
export const Connected: Story = {
  render: () => ({ Component: Demo, props: { part: "profile" } }),
};
export const Compact: Story = {
  render: () => ({
    Component: Demo,
    props: { part: "profile", compact: true },
  }),
};
export const Disconnected: Story = {
  render: () => ({
    Component: Demo,
    props: { part: "profile", scenario: "disconnected" },
  }),
};
