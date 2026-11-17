import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { buildCommit } from "./scripts/build-commit.ts";
import { pwaAssets } from "./scripts/pwa-assets.ts";
export default defineConfig({
  plugins: [svelte(), pwaAssets()],
  define: { "import.meta.env.VITE_APP_COMMIT": JSON.stringify(buildCommit()) },
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
      "@lapismd/design-core/chat",
      "@lapismd/design-core/workspace/plugins/notifications",
      "@lapismd/design-core/shadcn/badge",
      "@lapismd/design-core/shadcn/button",
      "@lapismd/design-core/shadcn/button-group",
      "@lapismd/design-core/shadcn/dropdown-menu",
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
      "@lapismd/design-core/shadcn/relative-time",
      "@lapismd/design-core/shadcn/collapsible",
      "@lapismd/design-core/shadcn/checkbox",
      "@lapismd/design-core/shadcn/scroll-area",
      "@lapismd/repository-ui/jj",
      "@lapismd/repository-ui/settings",
      "@tursodatabase/database-wasm/bundle",
    ],
  },
});
