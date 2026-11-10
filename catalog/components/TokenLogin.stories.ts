import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within } from "storybook/test";
import TokenLogin from "../../src/components/session/TokenLogin.svelte";
const meta = {
  title: "Maintenance/Components/Token login",
  component: TokenLogin,
  args: { onConnect: async () => {} },
} satisfies Meta<typeof TokenLogin>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Disconnected: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await expect(
      c.getByRole("button", { name: "Connect GitHub" }),
    ).toBeDisabled();
    await userEvent.type(
      c.getByLabelText("GitHub token"),
      "invented-story-token",
    );
    await expect(
      c.getByRole("button", { name: "Connect GitHub" }),
    ).toBeEnabled();
    await userEvent.click(c.getByRole("button", { name: "Connect GitHub" }));
    await expect(c.getByLabelText("GitHub token")).toHaveValue("");
  },
};
export const Connecting: Story = { args: { busy: true } };
export const Restoring: Story = { args: { restoring: true } };
export const Rejected: Story = {
  args: {
    error: "GitHub rejected this token. Check its access and reconnect.",
  },
};
