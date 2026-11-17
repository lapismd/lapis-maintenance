import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, within } from "storybook/test";
import Demo from "../ComponentDemo.svelte";
export default {
  title: "Maintenance/Components/Build version",
  component: Demo,
} satisfies Meta<typeof Demo>;
type Story = StoryObj<typeof Demo>;
export const CommitLink: Story = {
  args: { part: "navigation" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const version = await c.findByRole("link", { name: /^App version v/ });
    const href = version.getAttribute("href")!;
    await expect(href).toMatch(
      /^https:\/\/github.com\/lapismd\/lapis-maintenance\/commit\/[a-f0-9]{40}$/,
    );
    await expect(version).toHaveTextContent(
      `v${href.split("/").at(-1)!.slice(0, 8)}`,
    );
    const header = version
        .closest(".maintenance-brand-header")!
        .getBoundingClientRect(),
      rect = version.getBoundingClientRect();
    await expect(rect.left + rect.width / 2).toBeCloseTo(
      header.left + header.width / 2,
      0,
    );
    await expect(rect.top).toBeGreaterThanOrEqual(
      canvasElement.querySelector(".maintenance-brand")!.getBoundingClientRect()
        .bottom,
    );
  },
};
