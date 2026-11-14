import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import MaintenanceDemo from "./MaintenanceDemo.svelte";
const meta = {
  title: "Maintenance/Filter interactions",
  component: MaintenanceDemo,
} satisfies Meta<typeof MaintenanceDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const MultipleStatuses: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    await c.findByRole("heading", { name: "10 items in view" });
    await userEvent.click(
      c.getByRole("button", { name: "Show search and filters" }),
    );
    await userEvent.click(c.getByRole("button", { name: /Filter statuses:/ }));
    await userEvent.click(
      await page.findByRole("option", { name: /^Failed$/ }),
    );
    await userEvent.click(
      page.getByRole("option", { name: /^Approval waiting$/ }),
    );
    await expect(
      page.getByRole("option", { name: /^Failed$/ }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("option", { name: /^Approval waiting$/ }),
    ).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(
        page.queryByRole("listbox", { name: "Statuses", hidden: true }),
      ).not.toBeInTheDocument(),
    );
    await expect(
      c.getByRole("heading", { name: "2 items in view" }),
    ).toBeVisible();
    await userEvent.click(c.getByRole("button", { name: "Clear filters" }));
    await expect(
      c.getByRole("heading", { name: "10 items in view" }),
    ).toBeVisible();
  },
};

export const MultipleRepositories: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    await canvas.findByRole("button", { name: /Open card: Notebook release/ });
    await userEvent.click(
      canvas.getByRole("button", { name: "Show search and filters" }),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: /^Filter repositories:/ }),
    );
    const search = await page.findByRole("combobox", {
      name: "Search repositories",
    });
    await userEvent.type(search, "lapis-notes");
    await userEvent.click(
      await page.findByRole("option", { name: "lapismd/lapis-notes" }),
    );
    await expect(
      page.getByRole("option", { name: "lapismd/lapis-notes" }),
    ).toHaveAttribute("aria-selected", "true");
    await userEvent.clear(search);
    await userEvent.click(
      await page.findByRole("option", { name: "lapismd/lapis-desktop" }),
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(
        page.queryByRole("listbox", { name: "Repositories", hidden: true }),
      ).not.toBeInTheDocument(),
    );
    await expect(
      canvas.getByRole("button", { name: /^Filter repositories:/ }),
    ).toHaveTextContent("2 repositories");
    await expect(
      canvas.getByRole("heading", { name: "4 items in view" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Show lapismd/lapis-notes" }),
    ).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(
      canvas.getByRole("button", { name: "Clear filters" }),
    );
    await expect(
      canvas.getByRole("heading", { name: "10 items in view" }),
    ).toBeVisible();
  },
};

export const EmptyColumnsAcrossViews: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await c.findByRole("heading", { name: "10 items in view" });
    await userEvent.click(c.getByRole("button", { name: /^Workflows$/ }));
    await expect(
      await c.findByRole("button", { name: "Expand 0 Approval waiting" }),
    ).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(c.getByRole("button", { name: /^Pull requests$/ }));
    await c.findByRole("button", { name: "Expand 0 Failing" });
    await c.findByRole("button", { name: "Expand 0 Approval waiting" });
    await userEvent.click(c.getByRole("button", { name: /^Approvals$/ }));
    for (const label of ["Failing", "Needs review", "Blocked", "Activity"]) {
      await expect(
        await c.findByRole("button", { name: `Expand 0 ${label}` }),
      ).toHaveAttribute("aria-expanded", "false");
    }
  },
};
