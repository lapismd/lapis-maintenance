import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Component from "../../src/components/maintenance/MaintenanceInbox.svelte";
import Demo from "../ComponentDemo.svelte";
export default {
  title: "Maintenance/Components/Inbox",
  component: Component,
  parameters: {
    docs: {
      description: {
        component:
          "Production inbox used by MaintenanceScreen. The catalog host supplies a disposable controller and simulated ports.",
      },
    },
  },
} satisfies Meta<typeof Component>;
type Story = StoryObj<typeof Demo>;
export const Populated: Story = {
  render: () => ({ Component: Demo, props: { part: "inbox" } }),
};
export const Empty: Story = {
  render: () => ({
    Component: Demo,
    props: { part: "inbox", scenario: "empty" },
  }),
};
export const Loading: Story = {
  render: () => ({
    Component: Demo,
    props: { part: "inbox", scenario: "loading" },
  }),
};
export const PartialAccess: Story = {
  render: () => ({
    Component: Demo,
    props: { part: "inbox", scenario: "partial" },
  }),
};
export const Disconnected: Story = {
  render: () => ({
    Component: Demo,
    props: { part: "inbox", scenario: "disconnected" },
  }),
};
