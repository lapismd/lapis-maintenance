import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Component from "../../src/components/maintenance-review/ReviewActivity.svelte";
import Demo from "../review/ReviewDemo.svelte";
import { expect, userEvent, waitFor, within } from "storybook/test";
export default {
  title: "Maintenance/Review components/Activity",
  component: Component,
} satisfies Meta<typeof Component>;
type Story = StoryObj<typeof Demo>;
const render: Story["render"] = (args) => ({
  Component: Demo,
  props: { ...args, part: "activity" },
});
export const Timeline: Story = {
  render,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const list = await c.findByRole("list", { name: "Pull request activity" });
    await waitFor(() => {
      const images = list.querySelectorAll("img");
      expect(images).toHaveLength(3);
      expect(
        Array.from(images).every(
          (image) => image.complete && image.naturalWidth > 0,
        ),
      ).toBe(true);
    });
    await userEvent.click(
      c.getByRole("button", { name: "Load older activity" }),
    );
    await c.findByText("updated the lockfile");
    const avatars = list.querySelectorAll('[data-ui-component="avatar"]');
    await expect(avatars).toHaveLength(5);
    await expect(avatars[4]!.querySelector("img")).toBeNull();
    await expect(avatars[4]!).not.toBeEmptyDOMElement();
  },
};
export const Empty: Story = { render, args: { scenario: "empty" } };
export const Unavailable: Story = {
  render,
  args: { scenario: "resource-error" },
};
export const Loading: Story = { render, args: { scenario: "loading" } };
export const Dark: Story = { render, args: { theme: "dark" } };
export const Narrow: Story = { render, args: { width: 360 } };
