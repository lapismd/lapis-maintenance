import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import ReviewShell from "../src/components/maintenance-review/ReviewShell.svelte";
import Demo from "./review/ReviewDemo.svelte";
export default {
  title: "Maintenance/Review preview",
  component: ReviewShell,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "R1 UI review only. Local production components and controller with disposable fixture ports; every action is simulated, and the live application is unchanged. Start with Inbox, then open the main-panel PR workspace.",
      },
    },
  },
} satisfies Meta<typeof ReviewShell>;
type Story = StoryObj<typeof Demo>;
const render: Story["render"] = (args) => ({ Component: Demo, props: args });
export const Workspace: Story = {
  render,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await c.findByRole("heading", {
      name: "Publish approved registry updates",
      level: 1,
    });
    await expect(
      c.queryByRole("tab", { name: /^Files/ }),
    ).not.toBeInTheDocument();
    const files = c.getByRole("link", { name: "Files on GitHub" });
    await expect(files).toHaveAttribute(
      "href",
      "https://github.com/lapismd/plugin-registry/pull/63/files",
    );
    await expect(files).toHaveAttribute("target", "_blank");
    await userEvent.click(c.getByRole("tab", { name: /^Activity$/ }));
    await c.findByRole("list", { name: "Pull request activity" });
    await userEvent.click(c.getByRole("tab", { name: /^Overview$/ }));
  },
};
export const Inbox: Story = {
  render,
  args: {
    workspace: false,
    selected: "compatibility",
    scenario: "workflow-approval",
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await c.findByRole("button", { name: "Open PR view" });
    await userEvent.type(
      c.getByRole("textbox", { name: "Search maintenance items" }),
      "compatibility",
    );
    await userEvent.click(c.getByRole("button", { name: "Open PR view" }));
    await c.findByRole("heading", {
      name: "Review Design Core 0.12 compatibility",
      level: 1,
    });
    await userEvent.click(c.getByRole("button", { name: "Back to inbox" }));
    await expect(
      c.getByRole("textbox", { name: "Search maintenance items" }),
    ).toHaveValue("compatibility");
    await userEvent.clear(
      c.getByRole("textbox", { name: "Search maintenance items" }),
    );
  },
};
export const BreadcrumbNavigation: Story = {
  render,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const navigation = within(
      await c.findByRole("navigation", { name: "breadcrumb" }),
    );
    await userEvent.click(
      navigation.getByRole("button", { name: "lapismd/plugin-registry" }),
    );
    await c.findByRole("button", {
      name: "Filter repositories: plugin-registry",
    });
    await c.findByRole("heading", { name: "1 item in view" });
    const expand = c.queryByRole("button", { name: "Expand 1 Needs review" });
    if (expand) await userEvent.click(expand);
    await userEvent.click(
      c.getByRole("button", {
        name: /Open card: Publish approved registry updates/,
      }),
    );
    await userEvent.click(
      await c.findByRole("button", { name: "Open PR view" }),
    );
    await userEvent.click(
      within(
        await c.findByRole("navigation", { name: "breadcrumb" }),
      ).getByRole("button", { name: "All repositories" }),
    );
    await c.findByRole("button", {
      name: "Filter repositories: All repositories",
    });
    await c.findByRole("heading", { name: "10 items in view" });
  },
};
export const WorkflowApproval: Story = {
  render,
  args: { scenario: "workflow-approval", selected: "compatibility" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    const approve = await c.findByRole("button", {
      name: /^Approve workflow run$/,
    });
    await waitFor(() => expect(approve).toBeEnabled());
    await userEvent.click(approve);
    const dialog = within(await page.findByRole("dialog"));
    await waitFor(() => expect(dialog.getByText(/#41074/)).toBeVisible());
    await userEvent.click(
      dialog.getByRole("button", { name: "Simulate approve workflow run" }),
    );
    await within(
      c.getByRole("region", { name: "Pull request workspace" }),
    ).findByText("Preview · accepted");
    await expect(
      c.getByRole("button", { name: /^Approve workflow run$/ }),
    ).toBeDisabled();
  },
};
export const EnvironmentApproval: Story = {
  render,
  args: { scenario: "environment-approval" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    const approve = await c.findByRole("button", {
      name: /^Approve environment$/,
    });
    await waitFor(() => expect(approve).toBeEnabled());
    await userEvent.click(approve);
    const dialog = within(await page.findByRole("dialog"));
    await waitFor(() =>
      expect(dialog.getByText("npm-production")).toBeVisible(),
    );
    await userEvent.click(dialog.getByRole("button", { name: /^Cancel$/ }));
    await expect(c.queryByText("Preview · accepted")).not.toBeInTheDocument();
  },
};
export const Checks: Story = {
  render,
  args: { tab: "checks" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const checks = within(await c.findByRole("region", { name: "PR checks" }));
    const link = await checks.findByRole("link", {
      name: "Types and contracts",
    });
    await expect(link).toHaveAttribute(
      "href",
      "https://github.com/lapismd/plugin-registry/actions/runs/41030/job/12001",
    );
    await expect(
      checks.getByRole("button", { name: "Float Checks details" }),
    ).toBeVisible();
    await expect(
      checks.getByRole("button", { name: "Squash and merge" }),
    ).toBeDisabled();
  },
};
export const Activity: Story = { render, args: { tab: "activity" } };
export const PermissionDenied: Story = {
  render,
  args: { scenario: "permission-denied" },
};
export const Loading: Story = {
  render,
  args: { scenario: "loading", tab: "checks" },
};
export const Refreshing: Story = { render, args: { scenario: "refreshing" } };
export const Empty: Story = {
  render,
  args: { scenario: "empty", tab: "activity" },
};
export const ActivityError: Story = {
  render,
  args: { scenario: "resource-error", tab: "activity" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(
      await c.findByRole("button", { name: "Retry activity" }),
    );
    await c.findByRole("list", { name: "Pull request activity" });
    await userEvent.click(
      c.getByRole("button", { name: "Load older activity" }),
    );
    await c.findByText("requested an environment review");
  },
};
export const StaleTarget: Story = { render, args: { scenario: "stale" } };
export const Uncertain: Story = { render, args: { scenario: "uncertain" } };
export const Dark: Story = { render, args: { theme: "dark", tab: "checks" } };
export const Narrow: Story = { render, args: { width: 390, tab: "activity" } };
