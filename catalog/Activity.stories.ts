import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import ActivityFeed from "../src/components/maintenance-activity/ActivityFeed.svelte";
import Demo from "./review/ReviewDemo.svelte";
export default {
  title: "Maintenance/Workspace activity",
  component: ActivityFeed,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "UI preview only. Community-style timeline with shared PR activity rows, query-scoped fixture pages and measured virtualization. No GitHub transport or persistence.",
      },
    },
  },
} satisfies Meta<typeof ActivityFeed>;
type Story = StoryObj<typeof Demo>;
const render: Story["render"] = (args) => ({
  Component: Demo,
  props: { workspace: false, view: "activity", ...args },
});
export const Populated: Story = { render };
export const Timeline: Story = {
  render,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await c.findByText("40 of 240 events loaded");
    const viewport = c.getByRole("region", {
      name: "Activity timeline viewport",
    });
    const rows = () => c.getAllByRole("listitem");
    await waitFor(() => expect(rows().length).toBeGreaterThan(1));
    await expect(rows().length).toBeLessThan(30);
    await expect(viewport.scrollHeight).toBeGreaterThan(
      viewport.clientHeight * 3,
    );
    const heading = c.getByRole("heading", { level: 1, name: "Activity" });
    const toolbarRow = canvasElement.querySelector(".maintenance-toolbar-row")!;
    await expect(
      heading.getBoundingClientRect().top -
        toolbarRow.getBoundingClientRect().bottom,
    ).toBeLessThan(12);
    viewport.scrollTop = viewport.scrollHeight - viewport.clientHeight;
    await c.findByText("80 of 240 events loaded");
    await expect(rows().length).toBeLessThan(35);
    await waitFor(() =>
      expect(rows()[0]!.getAttribute("aria-posinset")).not.toBe("1"),
    );
    await userEvent.click(
      c.getAllByRole("button", {
        name: /^View details: Publish approved registry/,
      })[0]!,
    );
    await c.findByRole("button", { name: "Open PR view" });
    const offset = viewport.scrollTop;
    await userEvent.click(c.getByRole("button", { name: "Open PR view" }));
    await c.findByRole("region", { name: "Pull request workspace" });
    await userEvent.click(c.getByRole("button", { name: /^Activity$/ }));
    await c.findByText("80 of 240 events loaded");
    const restored = c.getByRole("region", {
      name: "Activity timeline viewport",
    });
    await waitFor(() =>
      expect(restored.scrollTop).toBeGreaterThan(offset - 250),
    );
    await expect(
      c.queryByRole("region", { name: "Pull request workspace" }),
    ).not.toBeInTheDocument();
  },
};
export const Filters: Story = {
  render,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    await c.findByText("40 of 240 events loaded");
    await expect(
      c.queryByRole("textbox", { name: "Search maintenance items" }),
    ).not.toBeInTheDocument();
    await userEvent.click(
      c.getByRole("button", { name: /^Filter activity types:/ }),
    );
    const reviews = await page.findByRole("option", { name: /^Reviews$/ });
    await expect(
      reviews.querySelector('[data-ui-part="item-icon"] svg'),
    ).toBeInTheDocument();
    await userEvent.click(reviews);
    await userEvent.click(page.getByRole("option", { name: /^Workflows$/ }));
    await expect(reviews).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("option", { name: /^Workflows$/ }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      reviews.querySelector('[data-ui-part="trailing"] svg'),
    ).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await c.findByText("40 of 69 events loaded");
    await userEvent.click(
      c.getByRole("button", { name: "Show search and filters" }),
    );
    const hide = c.getByRole("button", { name: "Hide search and filters" });
    await expect(hide).toHaveAttribute("aria-pressed", "true");
    await userEvent.type(
      c.getByRole("textbox", { name: "Search maintenance items" }),
      "impossible result",
    );
    await c.findByText("No matching activity");
    await userEvent.click(hide);
    await expect(
      c.queryByRole("textbox", { name: "Search maintenance items" }),
    ).not.toBeInTheDocument();
    await userEvent.click(
      c.getByRole("button", { name: "Show search and filters" }),
    );
    await expect(
      c.getByRole("textbox", { name: "Search maintenance items" }),
    ).toHaveValue("impossible result");
    await userEvent.click(c.getByRole("button", { name: "Clear filters" }));
    await c.findByText("40 of 69 events loaded");
  },
};
export const RepositoryNavigation: Story = {
  render,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const button = (
      await c.findAllByRole("button", {
        name: "View repository: lapismd/plugin-registry",
      })
    )[0]!;
    await expect(button.querySelector("svg")).toBeInTheDocument();
    await userEvent.click(button);
    await c.findByRole("heading", { name: "1 item in view" });
    await userEvent.click(
      c.getByRole("button", { name: "Show search and filters" }),
    );
    await expect(
      c.getByRole("button", { name: "Filter repositories: plugin-registry" }),
    ).toBeVisible();
    await expect(
      c.getByRole("button", { name: "Show lapismd/plugin-registry" }),
    ).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(c.getByRole("button", { name: /^Activity$/ }));
    await c.findByText("24 of 24 events loaded");
  },
};
export const ErrorAndRetry: Story = {
  render,
  args: { activityScenario: "error" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await c.findByText("Activity unavailable");
    await userEvent.click(c.getByRole("button", { name: "Retry activity" }));
    await c.findByText("40 of 240 events loaded");
  },
};
export const PageErrorAndRetry: Story = {
  render,
  args: { activityScenario: "page-error" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await c.findByText("40 of 240 events loaded");
    const viewport = c.getByRole("region", {
      name: "Activity timeline viewport",
    });
    viewport.scrollTop = viewport.scrollHeight - viewport.clientHeight;
    await c.findByRole("alert");
    await expect(c.getAllByRole("listitem").length).toBeGreaterThan(1);
    await expect(c.getByText("40 of 240 events loaded")).toBeVisible();
    await userEvent.click(c.getByRole("button", { name: "Retry activity" }));
    await c.findByText("80 of 240 events loaded");
    await expect(c.queryByRole("alert")).not.toBeInTheDocument();
  },
};
export const Loading: Story = { render, args: { activityScenario: "loading" } };
export const Empty: Story = { render, args: { activityScenario: "empty" } };
export const Refreshing: Story = {
  render,
  args: { activityScenario: "refreshing" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await c.findByText("40 of 240 events loaded");
    await userEvent.click(c.getByRole("button", { name: /^Refresh$/ }));
    await c.findByText("Refreshing activity");
    await expect(c.getAllByRole("listitem").length).toBeGreaterThan(1);
  },
};
export const Dark: Story = { render, args: { theme: "dark" } };
export const Narrow: Story = {
  render,
  args: { width: 390 },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await c.findByText("40 of 240 events loaded");
    await userEvent.click(
      c.getByRole("button", { name: "Expand dashboard controls" }),
    );
    await expect(
      c.getByRole("button", { name: /^Filter activity types:/ }),
    ).toBeVisible();
    const viewport = c.getByRole("region", {
      name: "Activity timeline viewport",
    });
    await waitFor(() =>
      expect(c.getAllByRole("listitem").length).toBeGreaterThan(0),
    );
    await expect(viewport.scrollWidth).toBeLessThanOrEqual(
      viewport.clientWidth + 1,
    );
    await expect(viewport.clientHeight).toBeGreaterThan(300);
  },
};

export const StickyDate: Story = {
  render,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await c.findByText("40 of 240 events loaded");
    const date = c.getByRole("heading", { name: "Current activity date" });
    await expect(date).toHaveTextContent("14 November 2026");
    const viewport = c.getByRole("region", {
      name: "Activity timeline viewport",
    });
    viewport.scrollTop = viewport.scrollHeight - viewport.clientHeight;
    await c.findByText("80 of 240 events loaded");
    viewport.scrollTop = viewport.scrollHeight - viewport.clientHeight;
    await c.findByText("120 of 240 events loaded");
    await waitFor(() => expect(date).toHaveTextContent("13 November 2026"));
    await expect(
      Math.abs(
        date.getBoundingClientRect().top - viewport.getBoundingClientRect().top,
      ),
    ).toBeLessThan(2);
    await expect(c.getAllByRole("listitem").length).toBeLessThan(35);
  },
};
