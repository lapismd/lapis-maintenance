import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, within } from "storybook/test";
import Demo from "../review/ReviewDemo.svelte";
export default {
  title: "Maintenance/Review components/Markdown description",
  component: Demo,
  args: { part: "workspace", scenario: "markdown-body" },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Demo>;
type Story = StoryObj<typeof Demo>;
const renderedMarkdown: NonNullable<Story["play"]> = async ({
  canvasElement,
}) => {
  const c = within(canvasElement);
  await c.findByRole("heading", { name: "Package publication context" });
  const table = c.getByRole("table");
  await expect(within(table).getAllByRole("row")).toHaveLength(4);
  await expect(
    c.getByRole("link", { name: "package registry" }),
  ).toHaveAttribute("href", "https://www.npmjs.com/package/example-package");
  const body = canvasElement.querySelector(".review-description-content")!;
  await expect(body.textContent).not.toContain("preview-profile-context");
  await expect(body.querySelector("script")).toBeNull();
  await expect(body.querySelector('a[href^="javascript:"]')).toBeNull();
  await expect(body.querySelector("strong")).toHaveTextContent(
    "Three package updates",
  );
  await expect(
    c.getByRole("region", { name: "Pull request description" }),
  ).toBeVisible();
};
export const Populated: Story = { play: renderedMarkdown };
export const Narrow: Story = { args: { width: 400 }, play: renderedMarkdown };
export const Dark: Story = { args: { theme: "dark" }, play: renderedMarkdown };
