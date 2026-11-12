import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { fn, expect, userEvent, within } from "storybook/test";
import PwaControls from "../../src/components/session/PwaControls.svelte";
const meta = {
  title: "Maintenance/Components/App installation",
  component: PwaControls,
  args: { onInstall: fn(), onReload: fn() },
} satisfies Meta<typeof PwaControls>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Install: Story = {
  args: { installAvailable: true },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "Install app" }),
    );
    await expect(args.onInstall).toHaveBeenCalledOnce();
  },
};
export const Update: Story = {
  args: { updateAvailable: true },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "Update" }),
    );
    await expect(args.onReload).toHaveBeenCalledOnce();
  },
};
export const CommandInProgress: Story = {
  args: { updateAvailable: true, busy: true },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("button", { name: "Update" }),
    ).toBeDisabled();
  },
};
