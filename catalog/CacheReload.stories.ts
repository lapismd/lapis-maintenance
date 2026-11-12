import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import MaintenanceDemo from "./MaintenanceDemo.svelte";
export default {
  title: "Maintenance/Cached reload",
  component: MaintenanceDemo,
} satisfies Meta<typeof MaintenanceDemo>;
type Story = StoryObj<typeof MaintenanceDemo>;
export const BackgroundRefresh: Story = {
  args: { scenario: "background-refresh" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await expect(
      await c.findByRole("button", { name: /Open card: Notebook release/ }),
    ).toBeVisible();
    await expect(
      c.queryByLabelText("Loading maintenance items"),
    ).not.toBeInTheDocument();
    await expect(
      await c.findByRole("img", { name: /Refreshing Desktop CI/ }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        c.queryByRole("img", { name: /Refreshing Notebook release/ }),
      ).not.toBeInTheDocument(),
    );
    await expect(
      c.getByRole("img", { name: /Refreshing Desktop CI/ }),
    ).toBeInTheDocument();
  },
};
export const DarkRefresh: Story = {
  args: { scenario: "background-refresh", theme: "dark" },
};
export const ReadonlyBootstrap: Story = {
  args: {
    scenario: "permissions",
    notice: "Reconnecting to GitHub. Cached data is read-only.",
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(
      await c.findByRole("button", { name: /Open card: Notebook release/ }),
    );
    await expect(
      await c.findByRole("button", { name: "Approve deployment" }),
    ).toBeDisabled();
    await expect(
      c.getByRole("button", { name: /Open status log:.*Reconnecting/ }),
    ).toBeVisible();
  },
};
export const LongChecksStayAboveMerge: Story = {
  args: { scenario: "long-checks" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await c.findByRole("button", { name: /Open card: Notebook release/ });
    await userEvent.type(
      c.getByRole("textbox", { name: "Search maintenance items" }),
      "Publish approved registry",
    );
    await userEvent.click(
      await c.findByRole("button", {
        name: /Open card: Publish approved registry/,
      }),
    );
    await c.findByText("Check 24");
    const viewport = canvasElement.querySelector(
      '.repository-checks [data-ui-part="scroll-area-viewport"]',
    ) as HTMLElement;
    const footer = canvasElement.querySelector(
      ".repository-pr__merge",
    ) as HTMLElement;
    expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight);
    expect(viewport.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      footer.getBoundingClientRect().top,
    );
    viewport.scrollTop = viewport.scrollHeight;
    await waitFor(() => expect(viewport.scrollTop).toBeGreaterThan(0));
    const last = c.getByText("Check 24");
    expect(last.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      footer.getBoundingClientRect().top,
    );
  },
};
