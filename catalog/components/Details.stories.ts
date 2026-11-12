import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Component from "../../src/components/maintenance/MaintenanceDetails.svelte";
import Demo from "../ComponentDemo.svelte";
import { expect, within } from "storybook/test";
export default {
  title: "Maintenance/Components/Details",
  component: Component,
  parameters: {
    docs: {
      description: {
        component:
          "Production details used by MaintenanceScreen. The catalog host supplies a disposable controller and simulated ports.",
      },
    },
  },
} satisfies Meta<typeof Component>;
type Story = StoryObj<typeof Demo>;
export const Workflow: Story = {
  render: () => ({ Component: Demo, props: { part: "details" } }),
};
export const PullRequest: Story = {
  render: () => ({
    Component: Demo,
    props: { part: "details", selected: "registry" },
  }),
};
export const Approval: Story = {
  render: () => ({
    Component: Demo,
    props: { part: "details", selected: "approval" },
  }),
};
export const LoadingCachedDetails: Story = {
  render: () => ({
    Component: Demo,
    props: {
      part: "details",
      selected: "dependency",
      scenario: "loading-details",
    },
  }),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await expect(
      await c.findByRole("heading", {
        name: "Refresh compatible first-party dependencies",
      }),
    ).toBeVisible();
    await expect(
      c.getByText("Loading details…", { exact: true }),
    ).toBeVisible();
    expect(c.queryByLabelText("Loading item details")).toBeNull();
  },
};
export const CachedRefreshing: Story = {
  render: () => ({
    Component: Demo,
    props: {
      part: "details",
      selected: "dependency",
      scenario: "cached-details",
    },
  }),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await expect(
      await c.findByText("Showing cached details · Refreshing…"),
    ).toBeVisible();
    await expect(
      c.getByRole("button", { name: "Squash and merge" }),
    ).toBeDisabled();
  },
};
