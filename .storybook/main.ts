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
  viteFinal: (config) => ({
    ...config,
    optimizeDeps: {
      ...config.optimizeDeps,
      include: [
        ...(config.optimizeDeps?.include ?? []),
        "@lapismd/design-core/shadcn/tabs",
        "@lapismd/design-core/shadcn/button-group",
        "@lapismd/design-core/shadcn/dropdown-menu",
        "@lapismd/design-core/shadcn/avatar",
        "@lapismd/design-core/shadcn/breadcrumb",
        "@lapismd/repository-ui/jj",
        "@tanstack/svelte-virtual",
      ],
    },
  }),
};
export default config;
