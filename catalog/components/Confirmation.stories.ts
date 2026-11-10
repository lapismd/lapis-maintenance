import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Component from "../../src/components/maintenance/ActionConfirmation.svelte";
import Demo from "../ComponentDemo.svelte";
export default {
  title: "Maintenance/Components/Confirmation",
  component: Component,
  parameters: {
    docs: {
      description: {
        component:
          "Production confirmation used by MaintenanceScreen. The catalog host supplies a disposable controller and simulated ports.",
      },
    },
  },
} satisfies Meta<typeof Component>;
type Story = StoryObj<typeof Demo>;
export const Workflow: Story = {
  render: () => ({ Component: Demo, props: { part: "confirmation" } }),
};
