import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import Demo from "./operations/OperationsDemo.svelte";
export default {
  title: "Maintenance/Operations",
  component: Demo,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Fixture-only coordinator waves, issues and explicit actions. Visual review pending.",
      },
    },
  },
} satisfies Meta<typeof Demo>;
type Story = StoryObj<typeof Demo>;
export const WavesAndIssues: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await c.findByRole("heading", {
      name: "Dependency and release operations",
    });
    await c.findByText("Expected upstream wait");
    await c.findByText("Manual repair ownership");
    await c.findByText("Compatibility decision");
    await c.findByRole("link", {
      name: /Review major framework compatibility/,
    });
  },
};
export const ImmediatePartialBatch: Story = {
  args: { uncertain: true },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      await c.findByRole("button", { name: "Rerun eligible failures" }),
    );
    await expect(page.queryByRole("dialog")).not.toBeInTheDocument();
    await c.findByText(/Fixture outcome unknown/);
    await c.findByText(/Fixture rerun accepted/);
  },
};
export const MissingReport: Story = { args: { state: "unavailable" } };
export const StaleReport: Story = { args: { state: "stale" } };
export const UnsupportedReport: Story = { args: { state: "unsupported" } };
export const Dark: Story = { args: { dark: true } };
export const WorkflowBatch: Story = {
  args: { action: "approve-run" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      await c.findByRole("button", { name: "Approve eligible workflows" }),
    );
    await expect(page.queryByRole("dialog")).not.toBeInTheDocument();
    await c.findAllByText(/Fixture rerun accepted/);
  },
};
export const EnvironmentBatch: Story = {
  args: { action: "approve-deployment" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      await c.findByRole("button", { name: "Approve eligible environments" }),
    );
    await expect(page.queryByRole("dialog")).not.toBeInTheDocument();
    await c.findAllByText(/Fixture rerun accepted/);
  },
};
