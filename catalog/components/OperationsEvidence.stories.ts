import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within } from "storybook/test";
import Component from "../../src/components/maintenance-operations/OperationsEvidence.svelte";
import { operatorFixture } from "../operations/fixtures";
export default {
  title: "Maintenance/Components/Operations evidence",
  component: Component,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Component>;
type Story = StoryObj<typeof Component>;
const evidence = operatorFixture().coordinator!;
export const Current: Story = {
  args: { evidence },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const toggle = c.getByRole("button", {
      name: /Synthetic coordinator evidence/,
    });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(
      c.queryByRole("button", { name: /Copy report ID / }),
    ).not.toBeInTheDocument();
    await userEvent.click(toggle);
    await c.findByRole("button", { name: /Copy report ID / });
    await c.findByText("2026-11-15T20:00:00Z");
  },
};
export const Unavailable: Story = {
  args: {
    evidence: {
      state: "unavailable",
      reason:
        "Coordinator report unavailable. Manual controls remain available.",
    },
  },
};
