import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { userEvent, within } from "storybook/test";
import Demo from "./operations/OperationsDemo.svelte";

export default {
  title: "Maintenance/Operations/Current state",
  component: Demo,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Fixture-only live GitHub and coordinator state. Visual review pending.",
      },
    },
  },
} satisfies Meta<typeof Demo>;

type Story = StoryObj<typeof Demo>;

export const PublishedButNotAdmitted: Story = {
  args: { currentState: true },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await c.findByRole("button", {
      name: "Release intents and admission 1",
    });
    await c.findByText(/published 1\.0\.1; coordinator admission/);
    await userEvent.click(
      c.getByRole("button", {
        name: /example\/repair Manual repair ownership/,
      }),
    );
    await c.findAllByText("No open pull request observed.");
    await c.findAllByText(
      "Observed coordinator source matches the refreshed default branch.",
    );
  },
};
