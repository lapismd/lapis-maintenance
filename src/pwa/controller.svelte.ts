interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
/** Host-owned installation/update lifecycle. Contains no session or repository data. */
export class PwaController {
  installAvailable = $state(false);
  updateAvailable = $state(false);
  installing = $state(false);
  #prompt?: InstallPrompt;
  #registration?: ServiceWorkerRegistration;
  #disposers: (() => void)[] = [];
  #disposed = false;
  #reloading = false;
  async start(): Promise<void> {
    if (!isSecureContext || !navigator.serviceWorker) return;
    const install = (event: Event) => {
      event.preventDefault();
      this.#prompt = event as InstallPrompt;
      this.installAvailable = true;
    };
    const installed = () => {
      this.#prompt = undefined;
      this.installAvailable = false;
    };
    const changed = () => {
      if (this.#reloading) location.reload();
    };
    window.addEventListener("beforeinstallprompt", install);
    window.addEventListener("appinstalled", installed);
    navigator.serviceWorker.addEventListener("controllerchange", changed);
    this.#disposers.push(() => {
      window.removeEventListener("beforeinstallprompt", install);
      window.removeEventListener("appinstalled", installed);
      navigator.serviceWorker.removeEventListener("controllerchange", changed);
    });
    try {
      const base = new URL(import.meta.env.BASE_URL, location.href);
      const registration = await navigator.serviceWorker.register(
        new URL("service-worker.js", base),
        {
          scope: base.pathname,
          updateViaCache: "none",
        },
      );
      if (this.#disposed) return;
      this.#registration = registration;
      const inspect = () => {
        if (!registration.waiting) return;
        if (
          navigator.serviceWorker.controller?.scriptURL.endsWith(
            "/coi-serviceworker.js",
          )
        ) {
          // Safe one-time migration: header-only worker to the app's combined worker.
          registration.waiting.postMessage({ type: "ACTIVATE_UPDATE" });
        } else this.updateAvailable = true;
      };
      const update = () => {
        const worker = registration.installing;
        if (!worker) return;
        const state = () => {
          if (worker.state === "installed") inspect();
        };
        worker.addEventListener("statechange", state);
        this.#disposers.push(() =>
          worker.removeEventListener("statechange", state),
        );
      };
      inspect();
      update();
      registration.addEventListener("updatefound", update);
      this.#disposers.push(() =>
        registration.removeEventListener("updatefound", update),
      );
    } catch {
      // The online app and memory-cache fallback remain usable when workers are denied.
    }
  }
  async install(): Promise<void> {
    const prompt = this.#prompt;
    if (!prompt || this.installing) return;
    this.installing = true;
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } finally {
      this.#prompt = undefined;
      this.installAvailable = false;
      this.installing = false;
    }
  }
  reloadUpdate(): void {
    if (!this.#registration?.waiting) return;
    this.#reloading = true;
    this.#registration.waiting.postMessage({ type: "ACTIVATE_UPDATE" });
  }
  dispose(): void {
    this.#disposed = true;
    this.#prompt = undefined;
    for (const dispose of this.#disposers.splice(0)) dispose();
  }
}
