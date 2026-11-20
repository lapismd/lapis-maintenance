import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, spyOn, userEvent, waitFor, within } from "storybook/test";
import Component from "../../src/components/maintenance/MaintenanceBoard.svelte";
import Demo from "../ComponentDemo.svelte";
export default {
  title: "Maintenance/Components/Board",
  component: Component,
  parameters: {
    docs: {
      description: {
        component:
          "Production board used by MaintenanceScreen. The catalog host supplies a disposable controller and simulated ports.",
      },
    },
  },
} satisfies Meta<typeof Component>;
type Story = StoryObj<typeof Demo>;
export const Kanban: Story = {
  render: () => ({ Component: Demo, props: { part: "board" } }),
};
export const CopyGitHubLinks: Story = {
  render: () => ({ Component: Demo, props: { part: "board" } }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("button", {
      name: "Column options for Failing",
    });
    const writeText = spyOn(navigator.clipboard, "writeText").mockResolvedValue(
      undefined,
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Column options for Failing" }),
    );
    const page = within(document.body);
    const copy = page.getByRole("menuitem", { name: "Copy GitHub links" });
    await waitFor(() => expect(copy).toBeVisible());
    await expect(copy.querySelector("svg")).toBeInTheDocument();
    await userEvent.click(copy);
    await expect(writeText).toHaveBeenCalledWith(
      "https://github.com/lapismd/lapis-desktop/actions/runs/41031",
    );
    await waitFor(() => expect(copy).not.toBeVisible());
    await page.findByText("Copied 1 GitHub link.");
    writeText.mockRestore();
  },
};
export const Activity: Story = {
  render: () => ({
    Component: Demo,
    props: { part: "board", view: "activity" },
  }),
};
export const Empty: Story = {
  render: () => ({
    Component: Demo,
    props: { part: "board", scenario: "empty" },
  }),
};
export const EmptyColumnsCollapsed: Story = {
  render: () => ({
    Component: Demo,
    props: { part: "board", view: "workflow" },
  }),
  play: async ({ canvasElement }) => {
    const { expect, within, userEvent } = await import("storybook/test");
    const c = within(canvasElement);
    await c.findByRole("button", { name: /Open card: Desktop CI/ });
    const empty = await c.findByRole("button", {
      name: "Expand 0 Approval waiting",
    });
    await expect(empty).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(empty);
    await c.findByRole("button", { name: "Collapse 0 Approval waiting" });
    await userEvent.click(
      c.getByRole("button", {
        name: "Column options for Approval waiting",
      }),
    );
    await expect(
      within(document.body).getByRole("menuitem", {
        name: "Copy GitHub links",
      }),
    ).toBeDisabled();
  },
};
export const RunningLane: Story = {
  render: () => ({ Component: Demo, props: { part: "board" } }),
  play: async ({ canvasElement }) => {
    const { expect, within, userEvent } = await import("storybook/test");
    const c = within(canvasElement);
    await c.findByRole("button", { name: /Open card: Notebook release/ });
    const expand = c.queryByRole("button", { name: "Expand 1 Running" });
    if (expand) await userEvent.click(expand);
    const card = await c.findByRole("button", { name: /Open card: Mira CI/ });
    const lane = card.closest('[data-ui-component="kanban-column"]')!;
    await expect(
      within(lane as HTMLElement).getByRole("heading", {
        name: "Running",
      }),
    ).toBeVisible();
    await expect(
      within(lane as HTMLElement).queryByRole("button", {
        name: /Open card: Previous CI/,
      }),
    ).not.toBeInTheDocument();
  },
};
