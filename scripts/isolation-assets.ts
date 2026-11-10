import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import type { Plugin } from "vite";
/** The published bootstrap is served separately, as its public integration requires. */
export function isolationAssets(): Plugin {
  const require = createRequire(import.meta.url);
  const source = readFileSync(require.resolve("coi-serviceworker"), "utf8");
  let base = "/";
  return {
    name: "maintenance-isolation-bootstrap",
    configResolved(config) {
      base = config.base;
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (request.url?.split("?")[0]?.endsWith("/coi-serviceworker.js")) {
          response.setHeader("Content-Type", "application/javascript");
          response.end(source);
        } else next();
      });
    },
    transformIndexHtml(_html, context) {
      if (context.path.includes("iframe.html")) return;
      return [
        {
          tag: "script",
          children:
            "window.coi = { quiet: true, coepCredentialless: () => true, doReload: () => { if (!window.lapisMaintenanceStarted) window.location.reload(); } };",
          injectTo: "head-prepend",
        },
        {
          tag: "script",
          attrs: { src: `${base}coi-serviceworker.js` },
          injectTo: "head-prepend",
        },
      ];
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "coi-serviceworker.js",
        source,
      });
    },
  };
}
