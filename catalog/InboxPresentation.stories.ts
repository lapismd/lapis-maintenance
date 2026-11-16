import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within } from "storybook/test";
import Demo from "./operations/OperationsDemo.svelte";
export default {
  title: "Maintenance/Inbox presentation",
  component: Demo,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Demo>;
type Story = StoryObj<typeof Demo>;
const singleRow: NonNullable<Story["play"]> = async ({ canvasElement }) => {
  const c = within(canvasElement);
  await c.findByText("Automation attention");
  const expand = c.queryByRole("button", { name: "Expand dashboard controls" });
  if (expand) await userEvent.click(expand);
  const row = canvasElement.querySelector<HTMLElement>(
    ".operations-attention",
  )!;
  const context = canvasElement.querySelector<HTMLElement>(
    ".maintenance-context-row",
  )!;
  const geometry = row.getBoundingClientRect();
  const above = context.getBoundingClientRect();
  await expect(geometry.left).toBeCloseTo(above.left, 0);
  await expect(geometry.right).toBeCloseTo(above.right, 0);
  await expect(geometry.height).toBeLessThan(58);
  await expect(row.scrollWidth).toBeLessThanOrEqual(row.clientWidth);
  const action = c.getByRole("button", {
    name: "View waves, issues and decisions",
  });
  await expect(action.getBoundingClientRect().right).toBeLessThanOrEqual(
    geometry.right,
  );
  await expect(
    c.queryByRole("button", { name: "Toggle automation attention" }),
  ).not.toBeInTheDocument();
};
export const Inbox: Story = {
  args: { shell: true, view: "inbox", width: 1074 },
  play: singleRow,
};
export const Narrow: Story = {
  args: { shell: true, view: "inbox", width: 400 },
  play: singleRow,
};
export const Dark: Story = {
  args: { shell: true, view: "inbox", width: 1074, dark: true },
  play: singleRow,
};
