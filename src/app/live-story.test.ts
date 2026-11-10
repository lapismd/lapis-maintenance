import { afterEach, expect, it, vi } from "vitest";
import config from "../../.storybook/main";

afterEach(() => vi.unstubAllEnvs());
async function stories(configType: "DEVELOPMENT" | "PRODUCTION") {
  const collect = config.stories;
  expect(collect).toBeTypeOf("function");
  if (typeof collect !== "function") throw new Error("Missing story selection");
  return collect([], { configType } as Parameters<typeof collect>[1]);
}
it("includes the real session story in local Storybook development", async () => {
  vi.stubEnv("VITEST", "");
  expect(await stories("DEVELOPMENT")).toContain(
    "../catalog/live/**/*.stories.ts",
  );
});
it("excludes live sessions from published Storybook", async () => {
  vi.stubEnv("VITEST", "");
  expect(await stories("PRODUCTION")).not.toContain(
    "../catalog/live/**/*.stories.ts",
  );
});
it("excludes live sessions from automated story runs", async () => {
  vi.stubEnv("VITEST", "true");
  expect(await stories("DEVELOPMENT")).not.toContain(
    "../catalog/live/**/*.stories.ts",
  );
});
