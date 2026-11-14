import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Component from "../../src/components/maintenance-review/ReviewFiles.svelte";
import Demo from "../review/ReviewDemo.svelte";
export default {
  title: "Maintenance/Review components/Files",
  component: Component,
} satisfies Meta<typeof Component>;
type Story = StoryObj<typeof Demo>;
const render: Story["render"] = (args) => ({
  Component: Demo,
  props: { ...args, part: "files" },
});
export const ChangedFiles: Story = { render };
export const Binary: Story = {
  render,
  args: { file: "assets/release-preview.png" },
};
export const Omitted: Story = {
  render,
  args: { file: "generated/catalog.json" },
};
export const Empty: Story = { render, args: { scenario: "empty" } };
export const Loading: Story = { render, args: { scenario: "loading" } };
