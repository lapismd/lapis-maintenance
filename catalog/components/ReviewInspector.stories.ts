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
export const PullRequest: Story = {
  render,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await c.findByRole("button", { name: "Open PR view" });
    const footer = canvasElement.querySelector<HTMLElement>(
      ".review-inspector-footer",
    )!;
    const buttons = within(footer)
      .getAllByRole("button")
      .filter((b) => b.closest(".review-pr-actions"));
    await expect(
      within(footer).getByRole("button", { name: "Comment" }),
    ).toBeVisible();
    await expect(footer.querySelector(".review-pr-actions > p")).toBeNull();
    const bounds = buttons.map((b) => b.getBoundingClientRect());
    for (const rect of bounds)
      await expect(rect.top).toBeCloseTo(bounds[0]!.top, 0);
    await expect(bounds.at(-1)!.right).toBeLessThanOrEqual(
      footer.getBoundingClientRect().right,
    );
  },
};
export const WorkflowApproval: Story = {
  render,
  args: { scenario: "workflow-approval", selected: "compatibility" },
};
export const EnvironmentApproval: Story = {
  render,
  args: { scenario: "environment-approval" },
};

export const WorkflowActionFooter: Story = {
  render,
  args: { selected: "running", view: "workflow" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const cancel = await c.findByRole("button", { name: "Cancel workflow" });
    const footer = cancel.closest<HTMLElement>(".review-inspector-footer")!;
    const styles = getComputedStyle(footer);
    await expect(parseFloat(styles.paddingTop)).toBeGreaterThan(0);
    await expect(parseFloat(styles.paddingRight)).toBeGreaterThan(0);
    await expect(parseFloat(styles.paddingBottom)).toBeGreaterThan(0);
    await expect(parseFloat(styles.paddingLeft)).toBeGreaterThan(0);
    const footerBounds = footer.getBoundingClientRect();
    const buttonBounds = cancel.getBoundingClientRect();
    await expect(buttonBounds.top).toBeGreaterThan(footerBounds.top);
    await expect(buttonBounds.right).toBeLessThan(footerBounds.right);
    await expect(buttonBounds.bottom).toBeLessThan(footerBounds.bottom);
    await expect(buttonBounds.left).toBeGreaterThan(footerBounds.left);
  },
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
    const border = (element: Element, edge: "Top" | "Bottom") =>
      parseFloat(getComputedStyle(element)[`border${edge}Width`]);
    const chevron = (element: Element) =>
      new DOMMatrixReadOnly(
        getComputedStyle(element.querySelector("svg")!).transform,
      );
    await expect(chevron(failed).b).toBeCloseTo(-1);
    await expect(chevron(passed).b).toBeCloseTo(-1);
    // Every joined edge is exactly one pixel, including the merge footer.
    const footer = canvasElement.querySelector(".review-check-footer")!;
    await expect(
      border(failed.parentElement!, "Bottom") +
        border(passed.parentElement!, "Top"),
    ).toBe(1);
    await expect(
      border(passed.parentElement!, "Bottom") + border(footer, "Top"),
    ).toBe(1);
    const headerHeight = failed.getBoundingClientRect().height;
    await userEvent.click(failed);
    await waitFor(() =>
      expect(failed).toHaveAttribute("aria-expanded", "true"),
    );
    await expect(border(failed, "Bottom")).toBe(0);
    const list = failed.parentElement!.querySelector("ul")!;
    await expect(border(list, "Top")).toBe(1);
    await expect(failed.getBoundingClientRect().height).toBe(headerHeight);
    await waitFor(() => expect(chevron(failed).a).toBeCloseTo(1));
    await expect(chevron(failed).b).toBeCloseTo(0);
    await userEvent.click(failed);
    await waitFor(() =>
      expect(failed).toHaveAttribute("aria-expanded", "false"),
    );
    await expect(border(failed.parentElement!, "Top")).toBe(1);
    await expect(failed.getBoundingClientRect().height).toBe(headerHeight);
    await expect(border(failed, "Bottom")).toBe(0);
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
