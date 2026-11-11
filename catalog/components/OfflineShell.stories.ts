import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { fn, expect, userEvent, within } from "storybook/test";
import OfflineShell from "../../src/components/session/OfflineShell.svelte";
const meta = {
  title: "Maintenance/Components/Offline shell",
  component: OfflineShell,
  args: { onReconnect: fn() },
} satisfies Meta<typeof OfflineShell>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Reconnect: Story = {
  play: async ({ canvasElement, args }) => {
    await expect(
      within(canvasElement).getByRole("heading", { name: "You’re offline" }),
    ).toBeVisible();
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "Reconnect" }),
    );
    await expect(args.onReconnect).toHaveBeenCalledOnce();
  },
};
