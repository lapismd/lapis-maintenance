import { settleIsolation } from "./isolation";
import { mount } from "svelte";
import "@lapismd/design-core/styles.css";
import "@lapismd/repository-ui/styles.css";
import "../styles/global.css";
import App from "./App.svelte";
await settleIsolation();
mount(App, { target: document.getElementById("app")! });
