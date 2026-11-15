import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import MaintenanceDemo from "./MaintenanceDemo.svelte";

const meta = {
  title: "Maintenance/Dashboard",
  component: MaintenanceDemo,
  parameters: {
    docs: {
      description: {
        component:
          "Complete Design Core AppShell and Kanban screen with Agent UI PR details. The host owns the production controller and disposable in-memory ports. Every operation is simulated; real tokens and live GitHub are out of scope until approval.",
      },
    },
  },
} satisfies Meta<typeof MaintenanceDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Inbox: Story = {};
export const Activity: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await c.findByRole("button", { name: /Open card: Notebook release/ });
    await userEvent.click(c.getByRole("button", { name: "Activity" }));
    await expect(
      await c.findByRole("group", {
        name: "Maintenance activity grouped by latest update",
      }),
    ).toBeVisible();
    await userEvent.click(
      c.getByRole("button", { name: /Open card: Notebook release/ }),
    );
    await expect(
      await c.findByRole("button", { name: "Approve deployment" }),
    ).toBeVisible();
  },
};
export const SearchAndInspect: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("button", { name: /Open card: Notebook release/ });
    await userEvent.click(
      canvas.getByRole("button", { name: "Show search and filters" }),
    );
    await userEvent.type(
      canvas.getByRole("textbox", { name: "Search maintenance items" }),
      "compatibility",
    );
    await userEvent.click(
      await canvas.findByRole("button", {
        name: /Open card: Review Design Core/,
      }),
    );
    await waitFor(() =>
      expect(
        canvas.getByLabelText("Maintenance item details"),
      ).toHaveTextContent("Compatibility review required"),
    );
    await expect(
      canvas.getByRole("link", { name: /Open on GitHub/ }),
    ).toHaveAttribute("href", "https://github.com/lapismd/lapis-notes/pull/74");
  },
};
async function submitApproval(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  await userEvent.click(
    await canvas.findByRole("button", { name: /Open card: Notebook release/ }),
  );
  await userEvent.click(
    await canvas.findByRole("button", {
      name: "Approve deployment",
    }),
  );
  await expect(
    within(canvasElement.ownerDocument.body).queryByRole("dialog"),
  ).not.toBeInTheDocument();
}
export const ImmediateAction: Story = {
  play: async ({ canvasElement }) => {
    await submitApproval(canvasElement);
    await expect(
      await within(canvasElement).findByText(
        "Simulated action completed successfully.",
      ),
    ).toBeVisible();
  },
};
export const RetryRead: Story = {
  args: { scenario: "read-error" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(
      await c.findByRole("button", {
        name: /Open status log:.*could not be reached/,
      }),
    );
    const log = within(
      await within(canvasElement.ownerDocument.body).findByRole("region", {
        name: "Status log",
      }),
    );
    await expect(log.getByRole("list")).toHaveTextContent(
      "could not be reached",
    );
    await userEvent.click(log.getByRole("button", { name: "Retry refresh" }));
    await userEvent.keyboard("{Escape}");
    await expect(
      await c.findByRole("button", { name: /Open card: Notebook release/ }),
    ).toBeVisible();
  },
};
export const RetryCommand: Story = {
  args: { scenario: "command-failure" },
  play: async ({ canvasElement }) => {
    await submitApproval(canvasElement);
    const c = within(canvasElement);
    await expect(await c.findByText(/simulated action failed/)).toBeVisible();
    await waitFor(() =>
      expect(
        within(canvasElement.ownerDocument.body).queryByRole("dialog", {
          hidden: true,
        }),
      ).not.toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(
        c.getByRole("button", { name: "Approve deployment" }),
      ).toBeEnabled(),
    );
    await userEvent.click(
      c.getByRole("button", { name: "Approve deployment" }),
    );
    await expect(
      within(canvasElement.ownerDocument.body).queryByRole("dialog"),
    ).not.toBeInTheDocument();
    await expect(
      await c.findByText("Simulated action completed successfully."),
    ).toBeVisible();
  },
};
export const ChangedTarget: Story = {
  args: { scenario: "stale-target" },
  play: async ({ canvasElement }) => {
    await submitApproval(canvasElement);
    await expect(
      await within(canvasElement).findByText(/Target or permissions changed/),
    ).toBeVisible();
  },
};
export const UnknownOutcome: Story = {
  args: { scenario: "uncertain" },
  play: async ({ canvasElement }) => {
    await submitApproval(canvasElement);
    const c = within(canvasElement);
    await expect(await c.findByText("Outcome unknown")).toBeVisible();
    await expect(
      c.getByRole("button", { name: "Approve deployment" }),
    ).toBeDisabled();
  },
};
export const ReadOnly: Story = {
  args: { scenario: "permissions" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(
      await c.findByRole("button", { name: /Open card: Notebook release/ }),
    );
    await expect(
      await c.findByRole("button", { name: "Approve deployment" }),
    ).toBeDisabled();
  },
};
export const AcceptedWorkflow: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(
      await c.findByRole("button", { name: /Open card: Desktop CI/ }),
    );
    const checks = within(await c.findByRole("region", { name: "CI checks" }));
    await expect(checks.getByText("Package acceptance")).toBeVisible();
    await userEvent.click(
      checks.getByRole("button", { name: /^Some checks were not successful/ }),
    );
    await waitFor(() =>
      expect(checks.getByText("Package acceptance")).not.toBeVisible(),
    );
    await userEvent.click(
      checks.getByRole("button", { name: /^Some checks were not successful/ }),
    );
    await userEvent.click(
      await c.findByRole("button", { name: "Rerun failed jobs" }),
    );
    await expect(
      within(canvasElement.ownerDocument.body).queryByRole("dialog"),
    ).not.toBeInTheDocument();
    await expect(await c.findByText("Accepted · still running")).toBeVisible();
  },
};
export const DemoConnection: Story = {
  args: { scenario: "disconnected" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(
      c.getByRole("button", { name: "Connect demo session" }),
    );
    await expect(
      await c.findByRole("button", { name: /Open card: Notebook release/ }),
    ).toBeVisible();
  },
};
export const ReviewAndMerge: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    await c.findByRole("button", { name: /Open card: Notebook release/ });
    await userEvent.click(
      c.getByRole("button", { name: "Show search and filters" }),
    );
    await userEvent.type(
      c.getByRole("textbox", { name: "Search maintenance items" }),
      "Version first-party",
    );
    await userEvent.click(
      await c.findByRole("button", { name: /Open card: Version first-party/ }),
    );
    await expect(
      await c.findByRole("button", { name: "Squash and merge" }),
    ).toBeDisabled();
    await expect(
      c.getByText("Required maintainer approval is still pending."),
    ).toBeVisible();
    await userEvent.click(c.getByRole("button", { name: "Approve PR" }));
    await expect(page.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(c.getByRole("button", { name: "Squash and merge" })).toBeEnabled(),
    );
    await userEvent.click(c.getByRole("button", { name: "Squash and merge" }));
    await expect(page.queryByRole("dialog")).not.toBeInTheDocument();
    await expect(
      await c.findByRole("button", {
        name: /Open status log:.*Simulated action completed successfully/,
      }),
    ).toBeVisible();
    await waitFor(() =>
      expect(
        c.queryByRole("button", { name: "Squash and merge" }),
      ).not.toBeInTheDocument(),
    );
    await expect(
      c.getByRole("heading", { name: "0 items in view" }),
    ).toBeVisible();
  },
};
export const Loading: Story = { args: { scenario: "loading" } };
export const Refreshing: Story = { args: { scenario: "refreshing" } };
export const Empty: Story = { args: { scenario: "empty" } };
export const PartialAccess: Story = { args: { scenario: "partial" } };
export const RateLimited: Story = { args: { scenario: "rate-limited" } };
export const Dark: Story = { args: { theme: "dark" } };
export const Narrow: Story = {
  args: { width: 390 },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const card = await c.findByRole("button", {
      name: /Open card: Notebook release/,
    });
    card.focus();
    await userEvent.keyboard("{Enter}");
    await expect(
      await c.findByRole("button", { name: "Approve deployment" }),
    ).toBeVisible();
  },
};

export const ProfileAndLogin: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      await canvas.findByRole("button", {
        name: /Open profile menu for.*Demo maintainer/,
      }),
    );
    await userEvent.click(
      await page.findByRole("menuitem", { name: "Settings" }),
    );
    const modal = await page.findByRole("dialog"),
      dialog = within(modal);
    await waitFor(() => expect(modal).toBeVisible());
    await expect(dialog.getByText(/simulates sign-in/)).toBeVisible();
    await userEvent.click(
      dialog.getByRole("button", { name: "Disconnect demo session" }),
    );
    await waitFor(() =>
      expect(
        page.queryByRole("dialog", { hidden: true }),
      ).not.toBeInTheDocument(),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Sign in with GitHub" }),
    );
    const login = within(await page.findByRole("dialog"));
    await userEvent.click(
      login.getByRole("button", { name: "Connect demo session" }),
    );
    await waitFor(() =>
      expect(
        page.queryByRole("dialog", { hidden: true }),
      ).not.toBeInTheDocument(),
    );
    await expect(
      await canvas.findByRole("button", {
        name: /Open profile menu for.*Demo maintainer/,
      }),
    ).toBeVisible();
  },
};
