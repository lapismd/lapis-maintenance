import { settleIsolation } from "./isolation";
import { mount } from "svelte";
import "@lapismd/design-core/styles.css";
import "@lapismd/repository-ui/styles.css";
import "../styles/global.css";
import App from "./App.svelte";
import { PwaController } from "../pwa/controller.svelte";
const pwa = new PwaController();
// Registration can outlast the bootstrap window; keep login bounded.
if (import.meta.env.PROD) void pwa.start();
await settleIsolation();
mount(App, { target: document.getElementById("app")!, props: { pwa } });
