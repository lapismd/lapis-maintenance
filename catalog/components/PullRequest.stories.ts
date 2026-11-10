import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Component from "../../src/components/maintenance/RepositoryReview.svelte";
import Demo from "../ComponentDemo.svelte";
export default {
  title: "Maintenance/Components/PullRequest",
  component: Component,
  parameters: {
    docs: {
      description: {
        component:
          "Production pullrequest used by MaintenanceScreen. The catalog host supplies a disposable controller and simulated ports.",
      },
    },
  },
} satisfies Meta<typeof Component>;
type Story = StoryObj<typeof Demo>;
export const ReviewNeeded: Story = {
  render: () => ({
    Component: Demo,
    props: { part: "review", selected: "version" },
  }),
};
export const Draft: Story = {
  render: () => ({
    Component: Demo,
    props: { part: "review", selected: "compatibility" },
  }),
};
export const MergeReady: Story = {
  render: () => ({
    Component: Demo,
    props: { part: "review", selected: "dependency" },
  }),
};
