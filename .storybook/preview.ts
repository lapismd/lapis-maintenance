import type { Preview } from "@storybook/svelte-vite";
import "@lapismd/design-core/styles.css";
import "@lapismd/repository-ui/styles.css";
import "../src/styles/global.css";
const preview: Preview = {
  parameters: {
    layout: "fullscreen",
    a11y: { test: "error" },
    controls: { disable: true },
  },
  tags: ["autodocs", "visual-pending"],
};
export default preview;
