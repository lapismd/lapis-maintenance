import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import Demo from "../dispatch/DispatchDemo.svelte";
export default {
  title: "Maintenance/Review components/Manual dispatch",
  component: Demo,
} satisfies Meta<typeof Demo>;
type Story = StoryObj<typeof Demo>;
export const TypedInputs: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    await userEvent.click(c.getByRole("button", { name: "Run workflow" }));
    const dialog = within(await page.findByRole("dialog"));
    await userEvent.click(
      dialog.getByRole("combobox", { name: "Choose a workflow" }),
    );
    await userEvent.click(
      await page.findByRole("option", { name: "Verify release" }),
    );
    await expect(
      dialog.getByRole("button", { name: "Simulate workflow dispatch" }),
    ).toBeDisabled();
    await userEvent.click(
      dialog.getByRole("combobox", {
        name: "Choose an explicit branch or tag",
      }),
    );
    await userEvent.click(
      await page.findByRole("option", { name: "branch: main" }),
    );
    await waitFor(() =>
      expect(
        dialog.getByRole("button", { name: "Simulate workflow dispatch" }),
      ).toBeEnabled(),
    );
    await expect(dialog.getByText("refs/heads/main")).toBeVisible();
    await userEvent.click(
      dialog.getByRole("button", { name: "Simulate workflow dispatch" }),
    );
    await within(
      await page.findByRole("region", { name: "Notifications" }),
    ).findByText(
      "Preview: workflow dispatch accepted. Publication is not confirmed.",
    );
  },
};
export const ChangedDefinition: Story = { args: { scenario: "rejected" } };
export const Uncertain: Story = { args: { scenario: "uncertain" } };

export const SearchableRepository: Story = {
  args: {
    repositories: [
      "lapismd/lapis-maintenance",
      "lapismd/dependency-automation",
      "lapismd/lapis-notes",
    ],
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    await userEvent.click(c.getByRole("button", { name: "Run workflow" }));
    const dialog = within(await page.findByRole("dialog"));
    await userEvent.click(
      dialog.getByRole("combobox", { name: "Choose repository" }),
    );
    const search = await page.findByRole("combobox", {
      name: "Search workflow repositories",
    });
    await userEvent.type(search, "dependency");
    await waitFor(() =>
      expect(
        page.queryByRole("option", {
          name: "lapismd/lapis-notes",
        }),
      ).not.toBeInTheDocument(),
    );
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await waitFor(() =>
      expect(
        dialog.getByRole("combobox", { name: "Choose repository" }),
      ).toHaveTextContent("lapismd/dependency-automation"),
    );
    await expect(
      dialog.getByRole("combobox", { name: "Choose a workflow" }),
    ).toHaveTextContent("Choose a workflow");
    await expect(
      dialog.getByRole("button", { name: "Simulate workflow dispatch" }),
    ).toBeDisabled();
    await userEvent.click(dialog.getByRole("button", { name: "Cancel" }));
  },
};
