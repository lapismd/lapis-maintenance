import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within } from "storybook/test";
import Demo from "./operations/OperationsDemo.svelte";
export default {
  title: "Maintenance/Operations history",
  component: Demo,
} satisfies Meta<typeof Demo>;
type Story = StoryObj<typeof Demo>;
export const LatestRepositoryDecisions: Story = {
  args: { shell: true, decisionHistory: true },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const section = await c.findByRole("region", {
      name: "Automation decisions",
    });
    await expect(
      within(section).getByRole("button", {
        name: "Automation decisions 1",
      }),
    ).toBeVisible();
    const row = within(section).getByRole("button", {
      name: "example/consumer Latest verified policy decision held",
    });
    await expect(row).toHaveAttribute("aria-expanded", "false");
    await expect(
      within(section).queryByText("Previous qualification failed"),
    ).not.toBeVisible();
    await userEvent.click(row);
    await expect(
      within(section).getByRole("heading", { name: "Previous decision" }),
    ).toBeVisible();
    await expect(
      within(section).getByText("Previous qualification failed"),
    ).toBeVisible();
    await expect(
      within(section).queryByText("Obsolete poll result"),
    ).not.toBeInTheDocument();
    const observed = section.querySelector<HTMLElement>(
      ".operations-observed-at",
    )!;
    await expect(
      observed.querySelector('[data-ui-component="relative-time"]'),
    ).not.toBeNull();
    await expect(observed.querySelector("time")).toHaveAttribute(
      "datetime",
      "2026-11-15T20:00:00.000Z",
    );
    await expect(
      parseFloat(getComputedStyle(observed).marginBottom),
    ).toBeGreaterThan(0);
    await expect(
      within(section).getAllByRole("button", {
        name: /Copy previous operation ID/,
      }),
    ).toHaveLength(1);
  },
};
