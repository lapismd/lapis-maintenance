import { expect, within, userEvent, waitFor } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Component from "../../src/components/maintenance/RepositoryFilter.svelte";
import Demo from "../ComponentDemo.svelte";
export default {
  title: "Maintenance/Components/RepositoryPicker",
  component: Component,
  parameters: {
    docs: {
      description: {
        component:
          "Production repositorypicker used by MaintenanceScreen. The catalog host supplies a disposable controller and simulated ports.",
      },
    },
  },
} satisfies Meta<typeof Component>;
type Story = StoryObj<typeof Demo>;
export const Basic: Story = {
  render: () => ({ Component: Demo, props: { part: "picker" } }),
};
export const Compact: Story = {
  render: () => ({ Component: Demo, props: { part: "picker", compact: true } }),
};

export const BranchFilter: Story = {
  render: () => ({ Component: Demo, props: { part: "picker", compact: true } }),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      c.getByRole("button", { name: "Filter repositories: All repositories" }),
    );
    await page.findByRole("option", {
      name: "lapismd/plugin-registry",
    });
    await userEvent.type(
      page.getByRole("combobox", { name: "Search repositories" }),
      "lapis",
    );
    await userEvent.click(
      page.getByRole("button", {
        name: "Filter default-branch Actions: All states",
      }),
    );
    await userEvent.click(await page.findByRole("option", { name: "Failed" }));
    await expect(page.getByRole("option", { name: "Failed" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(
        page.queryByRole("option", {
          name: "lapismd/plugin-registry",
        }),
      ).not.toBeInTheDocument(),
    );
    const repository = page.getByRole("option", {
      name: "lapismd/lapis-desktop",
    });
    await expect(
      within(repository).getByRole("img", { name: /main Actions: Failed/ }),
    ).toBeVisible();
    await userEvent.click(repository);
    await expect(repository).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{Escape}");
  },
};
