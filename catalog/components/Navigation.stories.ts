import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Component from "../../src/components/maintenance/MaintenanceNavigation.svelte";
import Demo from "../ComponentDemo.svelte";
import { expect, within, userEvent, waitFor } from "storybook/test";
export default {
  title: "Maintenance/Components/Navigation",
  component: Component,
  parameters: {
    docs: {
      description: {
        component:
          "Production navigation used by MaintenanceScreen. The catalog host supplies a disposable controller and simulated ports.",
      },
    },
  },
} satisfies Meta<typeof Component>;
type Story = StoryObj<typeof Demo>;
export const Expanded: Story = {
  render: () => ({ Component: Demo, props: { part: "navigation" } }),
};
export const Collapsed: Story = {
  render: () => ({
    Component: Demo,
    props: { part: "navigation", compact: true },
  }),
};
export const LongRepository: Story = {
  render: () => ({
    Component: Demo,
    props: { part: "navigation", scenario: "long-repositories" },
  }),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", {
      name: "Show lapismd/storybook-addon-visual-delta",
    });
    const label = button.querySelector("span")!;
    expect(getComputedStyle(label).textOverflow).toBe("ellipsis");
    expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
    expect(label.getBoundingClientRect().right).toBeLessThanOrEqual(
      button.getBoundingClientRect().right,
    );
  },
};

export const BranchActions: Story = {
  render: () => ({ Component: Demo, props: { part: "navigation" } }),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    const row = await c.findByRole("button", {
      name: "Show lapismd/plugin-registry",
    });
    const badge = within(row).getByRole("img", {
      name: /main Actions: Succeeded/,
    });
    await expect(badge.textContent?.trim()).toBe("");
    await expect(badge.getBoundingClientRect().right).toBeCloseTo(
      row.getBoundingClientRect().right -
        parseFloat(getComputedStyle(row).paddingRight) -
        parseFloat(getComputedStyle(row).borderRightWidth),
      0,
    );
    const filter = c.getByRole("button", {
      name: "Filter default-branch Actions: All states",
    });
    const heading = c.getByRole("button", { name: "Toggle repositories" });
    const f = filter.getBoundingClientRect(),
      h = heading.getBoundingClientRect();
    await expect(f.top + f.height / 2).toBeCloseTo(h.top + h.height / 2, 0);
    await userEvent.click(filter);
    await userEvent.click(await page.findByRole("option", { name: "Failed" }));
    const selected = page.getByRole("option", { name: "Failed" });
    await expect(
      selected.querySelector(
        ".repository-actions-selection .lucide-square-check",
      ),
    ).not.toBeNull();
    const options = page.getAllByRole("option");
    await expect(
      options[1]!.getBoundingClientRect().top -
        options[0]!.getBoundingClientRect().bottom,
    ).toBeGreaterThan(0);

    await waitFor(() =>
      expect(
        c.queryByRole("button", { name: "Show lapismd/plugin-registry" }),
      ).not.toBeInTheDocument(),
    );
    await c.findByRole("button", { name: "Show lapismd/lapis-desktop" });
    await userEvent.click(page.getByRole("option", { name: "Pending" }));
    await expect(page.getByRole("option", { name: "Failed" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.getByRole("option", { name: "Pending" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await c.findByRole("button", { name: "Show lapismd/mira-mde" });
    await userEvent.click(page.getByRole("option", { name: "All states" }));
    await c.findByRole("button", { name: "Show lapismd/plugin-registry" });
    await userEvent.keyboard("{Escape}");
  },
};
