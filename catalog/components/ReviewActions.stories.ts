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
    await userEvent.click(approve);
    await expect(page.queryByRole("dialog")).not.toBeInTheDocument();
    await c.findByText("Preview · completed");
    const merge = c.getByRole("button", { name: "Squash and merge" });
    await waitFor(() => expect(merge).toBeEnabled());
    await userEvent.click(merge);
    await c.findByText("The displayed PR revision was merged in this preview.");
    await expect(merge).toBeDisabled();
  },
};
export const NoChecks: Story = { render, args: { scenario: "empty" } };
export const ReadOnly: Story = {
  render,
  args: { scenario: "permission-denied" },
};
export const MergeWithoutApproval: Story = {
  render,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    const merge = await c.findByRole("button", { name: "Squash and merge" });
    await waitFor(() => expect(merge).toBeEnabled());
    await userEvent.click(merge);
    await c.findByText("The displayed PR revision was merged in this preview.");
    await expect(page.queryByRole("dialog")).not.toBeInTheDocument();
    await expect(merge).toBeDisabled();
  },
};
export const RepositoryRuleRejection: Story = {
  render,
  args: { scenario: "merge-blocked" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    const merge = await c.findByRole("button", { name: "Squash and merge" });
    await waitFor(() => expect(merge).toBeEnabled());
    await userEvent.click(merge);
    await c.findByText(/GitHub rejected the merge/);
    await expect(c.getByText("Preview · rejected")).toBeVisible();
    await expect(page.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(merge).toBeEnabled());
  },
};
export const MergeMethodDropdown: Story = {
  render,
  args: { scenario: "merge-options" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    await c.findByRole("button", { name: "Squash and merge" });
    await expect(
      c.queryByRole("button", { name: "Create merge commit" }),
    ).not.toBeInTheDocument();
    await userEvent.click(
      await c.findByRole("button", { name: "Choose merge method" }),
    );
    for (const option of await page.findAllByRole("menuitemradio")) {
      const doc = canvasElement.ownerDocument,
        walker = doc.createTreeWalker(option, NodeFilter.SHOW_TEXT),
        lines = new Set<number>();
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (!node.textContent?.trim()) continue;
        const range = doc.createRange();
        range.selectNodeContents(node);
        for (const rect of range.getClientRects())
          lines.add(Math.round(rect.top));
      }
      await expect(lines.size).toBe(1);
    }
    await userEvent.click(
      await page.findByRole("menuitemradio", { name: "Rebase and merge" }),
    );
    await waitFor(() =>
      expect(
        page.queryByRole("menu", { hidden: true }),
      ).not.toBeInTheDocument(),
    );
    await expect(page.queryByRole("dialog")).not.toBeInTheDocument();
    const merge = c.getByRole("button", { name: "Rebase and merge" });
    await userEvent.click(merge);
    await c.findByText("The displayed PR revision was merged in this preview.");
    await expect(merge).toBeDisabled();
  },
};
export const AutoMerge: Story = {
  render,
  args: { scenario: "auto-merge" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    const auto = await c.findByRole("button", { name: "Enable auto-merge" });
    await waitFor(() => expect(auto).toBeEnabled());
    await userEvent.click(auto);
    const disable = await c.findByRole("button", {
      name: "Disable auto-merge",
    });
    await expect(c.getByText(/^Auto-merge enabled ·/)).toBeVisible();
    await expect(page.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(disable).toBeEnabled());
    await userEvent.click(disable);
    await c.findByRole("button", { name: "Enable auto-merge" });
    await expect(page.queryByRole("dialog")).not.toBeInTheDocument();
  },
};
export const RequiredComment: Story = {
  render,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    const comment = await c.findByRole("button", {
      name: "Leave review comment",
    });
    await waitFor(() => expect(comment).toBeEnabled());
    await userEvent.click(comment);
    const form = within(await page.findByRole("dialog"));
    const submit = form.getByRole("button", { name: "Submit comment" });
    await expect(submit).toBeDisabled();
    await userEvent.type(
      form.getByLabelText("Comment (required)"),
      "Review feedback for this revision.",
    );
    await userEvent.click(submit);
    await c.findByText("Preview · completed");
    await waitFor(() =>
      expect(
        page.queryByRole("dialog", { hidden: true }),
      ).not.toBeInTheDocument(),
    );
  },
};
