import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { pwaAssets } from "./scripts/pwa-assets.ts";
export default defineConfig({
  plugins: [svelte(), pwaAssets()],
  base: "./",
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "credentialless",
    },
  },
  preview: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "credentialless",
    },
  },
  resolve: { dedupe: ["svelte"] },
  optimizeDeps: {
    include: [
      "@lapismd/design-core/shell",
      "@lapismd/design-core/shadcn/badge",
      "@lapismd/design-core/shadcn/button",
      "@lapismd/design-core/shadcn/dialog",
      "@lapismd/design-core/shadcn/empty",
      "@lapismd/design-core/shadcn/input",
      "@lapismd/design-core/shadcn/select",
      "@lapismd/design-core/shadcn/skeleton",
      "@lapismd/design-core/shadcn/textarea",
      "@lucide/svelte",
      "@lapismd/design-core/workspace/kanban",
      "@lapismd/design-core/shadcn/command-view",
      "@lapismd/design-core/shadcn/popover",
      "@lapismd/design-core/shadcn/input-group",
      "@lapismd/design-core/shadcn/tooltip",
      "@lapismd/design-core/shadcn/collapsible",
      "@lapismd/design-core/shadcn/checkbox",
      "@lapismd/design-core/shadcn/scroll-area",
      "@lapismd/repository-ui/jj",
      "@lapismd/repository-ui/settings",
      "@tursodatabase/database-wasm/bundle",
    ],
  },
});
