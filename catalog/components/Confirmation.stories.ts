import { expect, within, userEvent, waitFor } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Component from "../../src/components/maintenance/ActionInputDialog.svelte";
import Demo from "../ComponentDemo.svelte";
export default {
  title: "Maintenance/Components/Action inputs",
  component: Component,
  parameters: {
    docs: {
      description: {
        component:
          "Required-input form used by MaintenanceScreen. The catalog host supplies a disposable controller and simulated ports.",
      },
    },
  },
} satisfies Meta<typeof Component>;
type Story = StoryObj<typeof Demo>;
export const Comment: Story = {
  render: () => ({
    Component: Demo,
    props: { part: "confirmation", selected: "version" },
  }),
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const dialog = within(await page.findByRole("dialog"));
    const submit = dialog.getByRole("button", { name: "Submit comment" });
    await expect(submit).toBeDisabled();
    await userEvent.type(
      dialog.getByRole("textbox", { name: "Comment (required)" }),
      "Reviewed fixture",
    );
    await expect(submit).toBeEnabled();
    await userEvent.click(submit);
    await waitFor(() =>
      expect(page.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  },
};
