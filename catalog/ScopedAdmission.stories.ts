import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within } from "storybook/test";
import Demo from "./operations/OperationsDemo.svelte";
export default {
  title: "Maintenance/Operations scoped SDK",
  component: Demo,
  args: { scoped: true },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Controlled historical SDK0.2.0→0.2.1 report with test-only grants and CI; not live Desktop qualification. Read-only operator evidence, no commands on mount. Visual review pending.",
      },
    },
  },
} satisfies Meta<typeof Demo>;
type Story = StoryObj<typeof Demo>;
const inspect: NonNullable<Story["play"]> = async ({ canvasElement }) => {
  const c = within(canvasElement);
  await userEvent.click(
    await c.findByRole("button", {
      name: /lapismd\/lapis-desktop SDK-only · Running compatible update/,
    }),
  );
  const scoped = within(c.getByRole("region", { name: "SDK-only scope" }));
  await expect(
    scoped.getByRole("heading", { name: "SDK-only tooling update" }),
  ).toBeVisible();
  await expect(
    scoped.getByRole("heading", {
      name: /^Deferred package changes \(1\)$/,
    }),
  ).toBeVisible();
  await expect(
    scoped.getByText("@lapismd/design-core", { exact: true }),
  ).toBeVisible();
  await expect(
    scoped.getByRole("heading", { name: /^Deferred holds \(4\)$/ }),
  ).toBeVisible();
  await expect(
    scoped.getByText("@lapismd/ai: unavailable registry prerequisite", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    scoped.getByRole("heading", {
      name: /^Deferred upstream waits \(0\)$/,
    }),
  ).toBeVisible();
  await expect(
    scoped.getByRole("button", { name: /Copy scoped grant SHA256/ }),
  ).toBeVisible();
  await expect(
    scoped.getByRole("button", { name: /Copy full source descriptor SHA256:/ }),
  ).toBeVisible();
  await expect(
    c.getByRole("button", { name: "Rerun eligible failures" }),
  ).toBeDisabled();
};
export const DeferredWork: Story = { play: inspect };
export const DarkNarrow: Story = {
  args: { dark: true, width: 390 },
  play: inspect,
};
