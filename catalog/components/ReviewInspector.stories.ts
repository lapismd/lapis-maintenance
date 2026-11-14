import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, within, waitFor, userEvent } from "storybook/test";
import Component from "../../src/components/maintenance-review/ReviewInspector.svelte";
import Demo from "../review/ReviewDemo.svelte";
export default {
  title: "Maintenance/Review components/Inspector",
  component: Component,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The joined inspector in its owning AppShell. Open PR view moves into the main workspace.",
      },
    },
  },
} satisfies Meta<typeof Component>;
type Story = StoryObj<typeof Demo>;
const render: Story["render"] = (args) => ({
  Component: Demo,
  props: { ...args, workspace: false },
});
export const PullRequest: Story = { render };
export const WorkflowApproval: Story = {
  render,
  args: { scenario: "workflow-approval", selected: "compatibility" },
};
export const EnvironmentApproval: Story = {
  render,
  args: { scenario: "environment-approval" },
};

export const LongContent: Story = {
  render,
  args: { scenario: "long-inspector", width: 1074 },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await c.findByRole("heading", { name: /chore\(ci\): pin lock-f8d02/ });
    await c.findByText(/^0 current-revision approval/);
    const inspector =
        canvasElement.querySelector<HTMLElement>(".review-inspector")!,
      pane = inspector.closest("aside")!;
    await waitFor(() =>
      expect(inspector.getBoundingClientRect().right).toBeLessThanOrEqual(
        pane.getBoundingClientRect().right + 1,
      ),
    );
    await expect(inspector.scrollWidth).toBeLessThanOrEqual(
      inspector.clientWidth + 1,
    );
    for (const element of inspector.querySelectorAll<HTMLElement>(
      "h2, .review-button-row",
    )) {
      await expect(element.getBoundingClientRect().right).toBeLessThanOrEqual(
        pane.getBoundingClientRect().right + 1,
      );
    }
  },
};

export const CollapsedCheckGroups: Story = {
  render,
  args: { scenario: "failed-checks" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const failed = await c.findByRole("button", { name: "1 Failed checks" });
    await expect(failed).toHaveAttribute("aria-expanded", "false");
    const passed = c.getByRole("button", { name: "3 Passed checks" });
    await expect(passed).toHaveAttribute("aria-expanded", "false");
    await expect(
      c.getByRole("button", { name: "Squash and merge" }),
    ).toBeVisible();
  },
};

export const AutoMergeInBothViews: Story = {
  render,
  args: { scenario: "auto-merge" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const button = await c.findByRole("button", { name: "Enable auto-merge" });
    await waitFor(() => expect(button).toBeEnabled());
    await userEvent.click(c.getByRole("button", { name: "Open PR view" }));
    await c.findByRole("heading", {
      name: "Publish approved registry updates #63",
    });
    const main = within(canvasElement.querySelector("main")!);
    await waitFor(() =>
      expect(
        main.getByRole("button", { name: "Enable auto-merge" }),
      ).toBeEnabled(),
    );
  },
};
