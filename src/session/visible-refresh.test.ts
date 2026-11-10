import { expect, it, vi } from "vitest";
import { startVisibleRefresh } from "./visible-refresh";
import { MaintenanceController } from "../maintenance/controller.svelte";
import { MemoryMaintenancePort } from "../../catalog/memory-port";
it("pauses periodic reads while hidden and disposes the timer/listener", async () => {
  vi.useFakeTimers();
  try {
    const port = new MemoryMaintenancePort("populated", 0);
    const controller = new MaintenanceController(port, port);
    const refresh = vi.spyOn(controller, "refresh").mockResolvedValue();
    const events = new EventTarget();
    const page = {
      visibilityState: "hidden" as DocumentVisibilityState,
      addEventListener: events.addEventListener.bind(events),
      removeEventListener: events.removeEventListener.bind(events),
    };
    const stop = startVisibleRefresh(controller, page);
    await vi.advanceTimersByTimeAsync(300_000);
    expect(refresh).not.toHaveBeenCalled();
    page.visibilityState = "visible";
    events.dispatchEvent(new Event("visibilitychange"));
    expect(refresh).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(299_999);
    expect(refresh).toHaveBeenCalledOnce();
    stop();
    await vi.advanceTimersByTimeAsync(300_001);
    events.dispatchEvent(new Event("visibilitychange"));
    expect(refresh).toHaveBeenCalledOnce();
    controller.dispose();
  } finally {
    vi.useRealTimers();
  }
});
