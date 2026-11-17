import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, within, waitFor, userEvent } from "storybook/test";
import Demo from "../review/ReviewDemo.svelte";
export default {
  title: "Maintenance/Review components/Merge feedback",
  component: Demo,
} satisfies Meta<typeof Demo>;
type Story = StoryObj<typeof Demo>;
export const CompactMergeControls: Story = {
  args: { part: "actions" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const merge = await c.findByRole("button", { name: "Squash and merge" });
    await waitFor(() => expect(merge).toBeEnabled());
    for (const row of canvasElement.querySelectorAll(
      ".review-pr-actions:has([aria-label='Pull request merge controls'])",
    )) {
      await expect(row.querySelector("p")).toBeNull();
    }
    await userEvent.click(merge);
    await waitFor(() =>
      expect(merge).toHaveAttribute("title", "This pull request is closed."),
    );
    await expect(merge).toBeDisabled();
    await expect(
      merge.closest(".review-pr-actions")!.querySelector("p"),
    ).toBeNull();
  },
};
export const DisabledMergeReason: Story = {
  args: { part: "actions", scenario: "permission-denied" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const merge = await c.findByRole("button", { name: "Squash and merge" });
    await expect(merge).toBeDisabled();
    await expect(merge).toHaveAttribute("title");
    await expect(merge.getAttribute("title")).toMatch(
      /permission|write access/i,
    );
    const row = merge.closest(".review-pr-actions")!;
    await expect(row.querySelector("p")).toBeNull();
  },
};
