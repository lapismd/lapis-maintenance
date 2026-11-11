import type { Plugin } from "vite";
import { buildPwa } from "./pwa-build.mjs";
export function pwaAssets(): Plugin {
  let output = "dist";
  let base = "/";
  return {
    name: "maintenance-pwa-assets",
    apply: "build",
    configResolved(config) {
      output = config.build.outDir;
      base = config.base;
    },
    async closeBundle() {
      await buildPwa(output, base);
    },
  };
}
