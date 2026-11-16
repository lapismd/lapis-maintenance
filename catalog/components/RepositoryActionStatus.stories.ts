import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Component from "../../src/components/maintenance/RepositoryActionStatus.svelte";
export default {
  title: "Maintenance/Components/Repository Actions badge",
  component: Component,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Component>;
type Story = StoryObj<typeof Component>;
const repository = {
  repository: "lapismd/lapis-maintenance",
  available: true,
  actions: {
    branch: "main",
    sha: "a".repeat(40),
    state: "passed" as const,
    workflows: 3,
    reason: "3 workflows at the current revision.",
  },
};
export const Succeeded: Story = { args: { repository } };
export const Failed: Story = {
  args: {
    repository: {
      ...repository,
      actions: { ...repository.actions, state: "failed" },
    },
  },
};
export const Pending: Story = {
  args: {
    repository: {
      ...repository,
      actions: { ...repository.actions, state: "pending" },
    },
  },
};
export const Unknown: Story = {
  args: {
    repository: {
      repository: repository.repository,
      available: false,
      reason: "Actions access unavailable.",
    },
  },
};
export const Refreshing: Story = {
  args: { repository: { ...repository, loading: true } },
};
