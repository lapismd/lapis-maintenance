import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Component from "../../src/components/maintenance/RepositoryFilter.svelte";
import Demo from "../ComponentDemo.svelte";
export default {
  title: "Maintenance/Components/RepositoryPicker",
  component: Component,
  parameters: {
    docs: {
      description: {
        component:
          "Production repositorypicker used by MaintenanceScreen. The catalog host supplies a disposable controller and simulated ports.",
      },
    },
  },
} satisfies Meta<typeof Component>;
type Story = StoryObj<typeof Demo>;
export const Basic: Story = {
  render: () => ({ Component: Demo, props: { part: "picker" } }),
};
export const Compact: Story = {
  render: () => ({ Component: Demo, props: { part: "picker", compact: true } }),
};
