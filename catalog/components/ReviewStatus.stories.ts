import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, within } from "storybook/test";
import Component from "../../src/components/maintenance-review/ReviewStatus.svelte";

export default {
  title: "Maintenance/Review components/Status",
  component: Component,
} satisfies Meta<typeof Component>;
type Story = StoryObj<typeof Component>;
const check: Story["play"] = async ({ canvasElement, args }) => {
  const status =
    args.overview!.state !== "open"
      ? args.overview!.state
      : args.overview!.draft
        ? "draft"
        : "open";
  const label = status[0]!.toUpperCase() + status.slice(1);
  const chip = within(canvasElement).getByText(label, { exact: true });
  await expect(chip).toBeVisible();
  await expect(chip).toHaveAttribute("data-review-status", status);
  await expect(chip.querySelector("svg")).not.toBeNull();
  await expect(getComputedStyle(chip).backgroundColor).not.toBe(
    "rgba(0, 0, 0, 0)",
  );
};
export const Draft: Story = {
  args: { overview: { kind: "pull-request", state: "open", draft: true } },
  play: check,
};
export const Open: Story = {
  args: { overview: { kind: "pull-request", state: "open", draft: false } },
  play: check,
};
export const Merged: Story = {
  args: { overview: { kind: "pull-request", state: "merged", draft: true } },
  play: check,
};
export const Closed: Story = {
  args: { overview: { kind: "pull-request", state: "closed", draft: true } },
  play: check,
};
