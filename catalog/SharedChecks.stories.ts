import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within } from "storybook/test";
import MaintenanceScreen from "../src/components/maintenance/MaintenanceScreen.svelte";
import Demo from "./MaintenanceDemo.svelte";
export default {
  title: "Maintenance/Checks integration",
  component: MaintenanceScreen,
} satisfies Meta<typeof MaintenanceScreen>;
type Story = StoryObj<typeof Demo>;
async function inspect(canvasElement: HTMLElement, name: RegExp) {
  const c = within(canvasElement);
  const card = await c.findByRole("button", { name });
  card.focus();
  await userEvent.keyboard("{Enter}");
  const checks = within(await c.findByRole("region", { name: "CI checks" }));
  await expect(
    checks.getByRole("button", { name: "Check display options" }),
  ).toBeVisible();
  await userEvent.click(
    checks.getByRole("button", { name: "Collapse checks" }),
  );
  await expect(
    checks.getByRole("button", { name: "Expand checks" }),
  ).toHaveAttribute("aria-expanded", "false");
  await userEvent.click(checks.getByRole("button", { name: "Expand checks" }));
  return c;
}
export const Workflow: Story = {
  render: () => ({ Component: Demo }),
  play: async ({ canvasElement }) => {
    const c = await inspect(canvasElement, /Open card: Desktop CI/);
    await expect(
      c.getByRole("button", { name: "Float Workflow details" }),
    ).toBeVisible();
    await expect(
      c.queryByRole("button", { name: "Squash and merge" }),
    ).not.toBeInTheDocument();
  },
};
export const Approval: Story = {
  render: () => ({ Component: Demo }),
  play: async ({ canvasElement }) => {
    const c = await inspect(canvasElement, /Open card: Notebook release/);
    await expect(
      c.getByRole("button", { name: "Float Deployment details" }),
    ).toBeVisible();
  },
};
export const PullRequest: Story = {
  render: () => ({ Component: Demo }),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.type(
      c.getByRole("textbox", { name: "Search maintenance items" }),
      "Version first-party",
    );
    await inspect(canvasElement, /Open card: Version first-party/);
    await expect(
      c.getByRole("button", { name: "Squash and merge" }),
    ).toBeDisabled();
    await expect(
      c.getByRole("button", { name: "Float PR details" }),
    ).toBeVisible();
  },
};
export const LinkedPullRequest: Story = {
  render: () => ({ Component: Demo, props: { scenario: "linked-pr" } }),
  play: async ({ canvasElement }) => {
    const c = await inspect(canvasElement, /Open card: Desktop CI/);
    await expect(
      c.getByRole("button", { name: "Squash and merge" }),
    ).toBeDisabled();
    await expect(
      c.getByRole("button", { name: "Float PR details" }),
    ).toBeVisible();
  },
};
