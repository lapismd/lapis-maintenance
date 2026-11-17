import { defineConfig, mergeConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import vite from "./vite.config.ts";
export default mergeConfig(
  vite,
  defineConfig({
    test: {
      projects: [
        {
          extends: true,
          test: {
            name: "unit",
            include: ["src/**/*.test.ts"],
            exclude: ["src/**/*.browser.test.ts"],
            environment: "node",
          },
        },
        {
          extends: true,
          test: {
            name: "browser",
            // Real cache tests share the app's origin and global storage budget.
            fileParallelism: false,
            include: ["src/**/*.browser.test.ts"],
            testTimeout: 30_000,
            browser: {
              viewport: { width: 1280, height: 900 },
              enabled: true,
              provider: playwright(),
              headless: true,
              instances: [{ browser: "chromium" }],
            },
          },
        },
        {
          extends: true,
          plugins: [storybookTest({ configDir: ".storybook" })],
          optimizeDeps: {
            include: [
              "@lapismd/design-core/shadcn/tabs",
              "@lapismd/design-core/shadcn/button-group",
              "@lapismd/design-core/shadcn/dropdown-menu",
              "@lapismd/design-core/shadcn/avatar",
              "@lapismd/design-core/shadcn/breadcrumb",
              "@lapismd/repository-ui/jj",
              "@tanstack/svelte-virtual",
            ],
          },
          test: {
            name: "storybook",
            fileParallelism: false,
            testTimeout: 30000,
            browser: {
              enabled: true,
              provider: playwright(),
              headless: true,
              instances: [{ browser: "chromium" }],
            },
          },
        },
      ],
    },
  }),
);
