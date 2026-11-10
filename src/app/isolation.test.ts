import { afterEach, expect, it, vi } from "vitest";
import { settleIsolation } from "./isolation";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
function fixture(isolated: boolean, controlled = false) {
  vi.useFakeTimers();
  const host: Record<string, unknown> = {};
  host.top = host;
  const events = new EventTarget();
  const workers = {
    controller: controlled ? {} : null,
    ready: new Promise(() => {}),
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
  };
  const reload = vi.fn();
  vi.stubGlobal("window", host);
  vi.stubGlobal("location", { reload });
  vi.stubGlobal("crossOriginIsolated", isolated);
  vi.stubGlobal("isSecureContext", true);
  vi.stubGlobal("navigator", { serviceWorker: workers });
  return { host, workers, events, reload };
}
it("starts immediately when headers already isolate the application", async () => {
  const { host, reload } = fixture(true);
  await settleIsolation();
  expect(host.lapisMaintenanceStarted).toBe(true);
  expect(reload).not.toHaveBeenCalled();
});
it("bounds bootstrap waiting and then preserves credential input from late reloads", async () => {
  const { host } = fixture(false);
  const boot = settleIsolation();
  expect(host.lapisMaintenanceStarted).toBeUndefined();
  await vi.advanceTimersByTimeAsync(3000);
  await boot;
  expect(host.lapisMaintenanceStarted).toBe(true);
});
it("reloads before mounting when the new header worker takes control", async () => {
  const { workers, events, reload, host } = fixture(false);
  void settleIsolation();
  workers.controller = {};
  events.dispatchEvent(new Event("controllerchange"));
  await vi.advanceTimersByTimeAsync(0);
  expect(reload).toHaveBeenCalledOnce();
  expect(host.lapisMaintenanceStarted).toBeUndefined();
});
