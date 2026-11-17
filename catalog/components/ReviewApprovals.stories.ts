import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import Component from "../../src/components/maintenance-review/ReviewApprovals.svelte";
import Demo from "../review/ReviewDemo.svelte";
export default {
  title: "Maintenance/Review components/Approvals",
  component: Component,
} satisfies Meta<typeof Component>;
type Story = StoryObj<typeof Demo>;
const render: Story["render"] = (args) => ({
  Component: Demo,
  props: { ...args, part: "approvals" },
});
export const Environment: Story = { render };
export const Workflow: Story = {
  render,
  args: { scenario: "workflow-approval", selected: "compatibility" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const approve = await c.findByRole("button", {
      name: "Approve workflow run",
    });
    await waitFor(() => expect(approve).toBeEnabled());
    await userEvent.click(approve);
    await expect(approve).toBeDisabled();
    await expect(
      approve.querySelector(".maintenance-action-spinner"),
    ).not.toBeNull();
    await expect(
      within(canvasElement.ownerDocument.body).queryByRole("dialog"),
    ).not.toBeInTheDocument();
    await within(
      await within(canvasElement.ownerDocument.body).findByRole("region", {
        name: "Notifications",
      }),
    ).findByText("Preview · accepted");
  },
};
export const Denied: Story = {
  render,
  args: { scenario: "permission-denied" },
};
export const CheckingEligibility: Story = {
  render,
  args: { scenario: "eligibility-checking" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await c.findByText(/Checking whether this session/);
    await expect(
      c.getByRole("button", { name: /^Approve environment$/ }),
    ).toBeDisabled();
  },
};
export const WaitingForReviewer: Story = {
  render,
  args: { scenario: "reviewer-wait" },
};
export const Empty: Story = { render, args: { scenario: "empty" } };
export const Stale: Story = {
  render,
  args: { scenario: "stale" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    const approve = await c.findByRole("button", {
      name: /^Approve environment$/,
    });
    await waitFor(() => expect(approve).toBeEnabled());
    await userEvent.click(approve);
    await expect(page.queryByRole("dialog")).not.toBeInTheDocument();
    await within(
      await within(canvasElement.ownerDocument.body).findByRole("region", {
        name: "Notifications",
      }),
    ).findByText("Preview · rejected");
  },
};
export const Uncertain: Story = {
  render,
  args: { scenario: "uncertain" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    const approve = await c.findByRole("button", {
      name: /^Approve environment$/,
    });
    await waitFor(() => expect(approve).toBeEnabled());
    await userEvent.click(approve);
    await expect(page.queryByRole("dialog")).not.toBeInTheDocument();
    await within(
      await within(canvasElement.ownerDocument.body).findByRole("region", {
        name: "Notifications",
      }),
    ).findByText("Preview · uncertain");
    await expect(
      c.getByRole("button", { name: /^Approve environment$/ }),
    ).toBeDisabled();
  },
};
