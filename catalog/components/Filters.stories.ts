import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Component from "../../src/components/maintenance/MaintenanceFilters.svelte";
import Demo from "../ComponentDemo.svelte";
export default {
  title: "Maintenance/Components/Filters",
  component: Component,
  parameters: {
    docs: {
      description: {
        component:
          "Production filters used by MaintenanceScreen. The catalog host supplies a disposable controller and simulated ports.",
      },
    },
  },
} satisfies Meta<typeof Component>;
type Story = StoryObj<typeof Demo>;
export const Basic: Story = {
  render: () => ({ Component: Demo, props: { part: "filters" } }),
};
export const ClearFilters: Story = {
  render: () => ({ Component: Demo, props: { part: "filters" } }),
  play: async ({ canvasElement }) => {
    const { expect, userEvent, within } = await import("storybook/test");
    const c = within(canvasElement);
    await userEvent.type(
      c.getByRole("textbox", { name: "Search maintenance items" }),
      "registry",
    );
    const clear = c.getByRole("button", { name: "Clear filters" });
    expect(clear.textContent?.trim()).toBe("");
    const rect = clear.getBoundingClientRect();
    expect(rect.width).toBe(rect.height);
    expect(getComputedStyle(clear).borderRadius).toBe("50%");
    await userEvent.click(clear);
    expect(
      c.getByRole("textbox", { name: "Search maintenance items" }),
    ).toHaveValue("");
  },
};
