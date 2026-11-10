import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within, fn } from "storybook/test";
import Component from "../../src/components/session/RepositorySettings.svelte";
const meta = {
  title: "Maintenance/Components/Repository settings",
  component: Component,
  args: {
    session: {
      selection: { additions: [], exclusions: [] },
      configure: fn(async () => {}),
      repositoryDefaults: [
        { repository: "lapismd/design-core" },
        { repository: "lapismd/plugin-registry" },
      ],
    },
  },
} satisfies Meta<typeof Component>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Basic: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      c.getByRole("button", { name: "Repository settings" }),
    );
    const dialog = within(await page.findByRole("dialog"));
    await userEvent.type(
      dialog.getByRole("textbox", { name: "Additional repositories" }),
      "https://github.com/lapismd/design-core",
    );
    await userEvent.click(
      dialog.getByRole("button", { name: "Save repositories" }),
    );
    await expect(dialog.getByRole("alert")).toHaveTextContent(
      "Use owner/repository names",
    );
    await userEvent.clear(
      dialog.getByRole("textbox", { name: "Additional repositories" }),
    );
    await userEvent.type(
      dialog.getByRole("textbox", { name: "Additional repositories" }),
      "lapismd/design-core",
    );
    await userEvent.click(
      dialog.getByRole("button", { name: "Save repositories" }),
    );
  },
};
export const SelectDefaults: Story = {
  play: async ({ canvasElement, args }) => {
    const c = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      c.getByRole("button", { name: "Repository settings" }),
    );
    const dialog = within(await page.findByRole("dialog"));
    const checkbox = dialog.getByRole("checkbox", {
      name: "lapismd/design-core",
    });
    await expect(checkbox).toBeChecked();
    await userEvent.click(checkbox);
    await expect(checkbox).not.toBeChecked();
    await userEvent.click(
      dialog.getByRole("button", { name: "Save repositories" }),
    );
    await expect(args.session.configure).toHaveBeenCalledWith({
      additions: [],
      exclusions: ["lapismd/design-core"],
    });
  },
};
