import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import Component from "../../src/components/maintenance-review/ReviewActions.svelte";
import Demo from "../review/ReviewDemo.svelte";
export default {
  title: "Maintenance/Review components/Actions",
  component: Component,
} satisfies Meta<typeof Component>;
type Story = StoryObj<typeof Demo>;
const render: Story["render"] = (args) => ({
  Component: Demo,
  props: { ...args, part: "actions" },
});
export const ReviewThenMerge: Story = {
  render,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    const approve = await c.findByRole("button", { name: /^Approve PR$/ });
    await waitFor(() => expect(approve).toBeEnabled());
    await expect(
      c.getByRole("button", { name: "Squash and merge" }),
    ).toBeDisabled();
    await userEvent.click(approve);
    await userEvent.click(
      within(await page.findByRole("dialog")).getByRole("button", {
        name: "Simulate approve pr",
      }),
    );
    await c.findByText("Preview · completed");
    await waitFor(() =>
      expect(
        page.queryByRole("dialog", { hidden: true }),
      ).not.toBeInTheDocument(),
    );
    const merge = c.getByRole("button", { name: "Squash and merge" });
    await waitFor(() => expect(merge).toBeEnabled());
    await userEvent.click(merge);
    await userEvent.click(
      within(await page.findByRole("dialog")).getByRole("button", {
        name: "Simulate squash and merge",
      }),
    );
    await c.findByText("The displayed PR revision was merged in this preview.");
    await expect(merge).toBeDisabled();
  },
};
export const NoChecks: Story = { render, args: { scenario: "empty" } };
export const ReadOnly: Story = {
  render,
  args: { scenario: "permission-denied" },
};
