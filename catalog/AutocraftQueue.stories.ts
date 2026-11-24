import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within } from "storybook/test";
import Demo from "./operations/OperationsDemo.svelte";
export default {
  title: "Maintenance/AutoCraft Queue",
  component: Demo,
  args: { autocraftState: "current" },
  tags: ["visual-pending"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Fixture-only agent queue and typed receipts. Visual review pending.",
      },
    },
  },
} satisfies Meta<typeof Demo>;
type Story = StoryObj<typeof Demo>;
export const IndependentReview: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement),
      section = await c.findByRole("region", { name: "AutoCraft agent queue" }),
      q = within(section);
    await q.findByText("Synthetic AutoCraft evidence · fixture only.");
    await userEvent.click(
      q.getByRole("button", { name: /example\/repair #148/ }),
    );
    await q.findByText(
      "Focused regression: 1 failure before, 0 after. Full required lanes passed.",
    );
    await expect(
      q.getByRole("link", { name: "Open pull request #148" }),
    ).toHaveAttribute("href", "https://github.com/example/repair/pull/148");
    await expect(
      q.queryByRole("button", { name: /approve|merge|rerun/i }),
    ).not.toBeInTheDocument();
    await expect(
      q.getByRole("link", { name: "Immutable queue report" }),
    ).toHaveAttribute(
      "href",
      `https://github.com/lapismd/lapis-autocraft/blob/${"c".repeat(40)}/report.json`,
    );
  },
};
export const Stale: Story = {
  args: { autocraftState: "stale" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await c.findByText(
      "AutoCraft report is stale or unavailable. Manual controls remain available.",
    );
    await expect(
      c.getByRole("region", { name: "Batch actions" }),
    ).toBeVisible();
  },
};
export const Missing: Story = { args: { autocraftState: "unavailable" } };
