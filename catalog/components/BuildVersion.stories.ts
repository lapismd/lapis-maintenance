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
    const version = await c.findByRole("link", { name: /^App version / });
    const href = version.getAttribute("href")!;
    await expect(href).toMatch(
      /^https:\/\/github.com\/lapismd\/lapis-maintenance\/commit\/[a-f0-9]{40}$/,
    );
    await expect(version).toHaveTextContent(
      href.split("/").at(-1)!.slice(0, 8),
    );
    const header = version
        .closest(".maintenance-brand-header")!
        .getBoundingClientRect(),
      rect = version.getBoundingClientRect();
    const brand =
      canvasElement.querySelector<HTMLElement>(".maintenance-brand")!;
    const logo = brand.querySelector("img")!.getBoundingClientRect();
    await expect(logo.left).toBeCloseTo(
      header.left + parseFloat(getComputedStyle(brand).paddingLeft),
      0,
    );
    const brandText = brand
      .querySelector(".maintenance-brand-text")!
      .getBoundingClientRect();
    await expect(logo.top + logo.height / 2).toBeCloseTo(
      brandText.top + brandText.height / 2,
      0,
    );
    const subtitle = brand
      .querySelector(".maintenance-brand-sub")!
      .getBoundingClientRect();
    await expect(rect.left + rect.width / 2).toBeCloseTo(
      subtitle.left + subtitle.width / 2,
      0,
    );
    await expect(rect.top).toBeGreaterThanOrEqual(subtitle.bottom);
  },
};
