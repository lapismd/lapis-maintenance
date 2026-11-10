import type { Meta, StoryObj } from "@storybook/svelte-vite";
import App from "../../src/app/App.svelte";

/** Manual local acceptance: credentials stay inside the production session host. */
const meta = {
  title: "Maintenance/Live",
  component: App,
  tags: ["!autodocs", "!test", "manual-live"],
  parameters: {
    layout: "fullscreen",
    controls: { disable: true },
    actions: { disable: true },
  },
} satisfies Meta<typeof App>;
export default meta;
type Story = StoryObj<typeof meta>;
export const GitHubSession: Story = { name: "GitHub session" };
