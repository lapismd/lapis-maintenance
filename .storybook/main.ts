import type { StorybookConfig } from "@storybook/svelte-vite";
const config: StorybookConfig = {
  stories: (_existing, { configType }) => [
    "../catalog/*.stories.ts",
    "../catalog/components/**/*.stories.ts",
    ...(configType === "DEVELOPMENT" && !process.env.VITEST
      ? ["../catalog/live/**/*.stories.ts"]
      : []),
  ],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest",
  ],
  framework: { name: "@storybook/svelte-vite", options: {} },
};
export default config;
