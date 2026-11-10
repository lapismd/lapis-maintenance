import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
export default defineConfig({
  plugins: [svelte()],
  resolve: { dedupe: ["svelte"] },
  optimizeDeps: {
    include: [
      "@lapismd/design-core/shell",
      "@lapismd/design-core/workspace/kanban",
      "@lapismd/design-core/shadcn/command-view",
      "@lapismd/design-core/shadcn/popover",
      "@lapismd/design-core/shadcn/input-group",
      "@lapismd/repository-ui/jj",
      "@lapismd/repository-ui/settings",
    ],
  },
});
