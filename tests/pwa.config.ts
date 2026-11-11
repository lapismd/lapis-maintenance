import { defineConfig } from "playwright/test";
export default defineConfig({
  testDir: ".",
  testMatch: "pwa.pw.ts",
  workers: 1,
  timeout: 45000,
  use: { browserName: "chromium", headless: true },
});
