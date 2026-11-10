/** Let the public header bootstrap settle before accepting credentials. */
export async function settleIsolation(): Promise<void> {
  if (
    globalThis.crossOriginIsolated === false &&
    isSecureContext &&
    navigator.serviceWorker
  ) {
    await new Promise<void>((resolve) => {
      const workers = navigator.serviceWorker;
      const finish = () => {
        clearTimeout(timer);
        workers.removeEventListener("controllerchange", finish);
        resolve();
      };
      const timer = setTimeout(finish, 3000);
      workers.addEventListener("controllerchange", finish, { once: true });
      void workers.ready
        .then(() => {
          if (workers.controller) finish();
        })
        .catch(finish);
    });
    if (navigator.serviceWorker.controller && window === window.top) {
      location.reload();
      return new Promise<void>(() => {});
    }
  }
  Object.assign(window, { lapisMaintenanceStarted: true });
}
