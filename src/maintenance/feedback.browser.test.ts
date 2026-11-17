import { afterEach, expect, it, vi } from "vitest";
import { FeedbackCenter } from "./feedback.svelte";
import { mount, unmount } from "svelte";
import { page } from "vitest/browser";
import FeedbackHost from "../components/feedback/FeedbackHost.svelte";
import "@lapismd/design-core/styles.css";
const centers: FeedbackCenter[] = [];
const center = () => {
  const feedback = new FeedbackCenter();
  centers.push(feedback);
  return feedback;
};
const error = {
  id: "resource:error",
  message: "GitHub unavailable",
  severity: "error" as const,
};
it("gives toast actions a themed background before hover", async () => {
  const c = center();
  c.sync("resource", [
    { ...error, action: { label: "View details", run: () => {} } },
  ]);
  const target = document.createElement("div");
  document.body.append(target);
  const app = mount(FeedbackHost, { target, props: { center: c } });
  try {
    const button = page.getByRole("button", {
      name: "View details",
      exact: true,
    });
    await expect.element(button).toBeVisible();
    expect(getComputedStyle(button.element()).backgroundColor).not.toBe(
      "rgba(0, 0, 0, 0)",
    );
  } finally {
    await unmount(app);
    target.remove();
  }
});
afterEach(() => {
  centers.splice(0).forEach((c) => c.dispose());
  vi.useRealTimers();
});
it("deduplicates pending refreshes and shared command receipts, rearming after recovery", () => {
  const c = center();
  c.sync("resource", [error]);
  c.dismiss(error.id);
  c.sync("resource", [], true);
  c.sync("resource", [error]);
  expect(c.records).toHaveLength(0);
  c.sync("resource", []);
  c.sync("resource", [error]);
  expect(c.records).toHaveLength(1);
  const command = {
    id: "command:1",
    message: "Approved",
    severity: "info" as const,
  };
  c.sync("status", [{ ...command, detail: "owner/repo: Approved" }]);
  c.dismiss(command.id);
  c.sync("review", [command]);
  expect(c.records.some((r) => r.id === command.id)).toBe(false);
});
it("dismisses after ten seconds of active time and clears all timers on disposal", () => {
  vi.useFakeTimers();
  const c = center();
  c.sync("resource", [error]);
  vi.advanceTimersByTime(4_000);
  c.pause(error.id);
  vi.advanceTimersByTime(20_000);
  expect(c.records).toHaveLength(1);
  c.resume(error.id);
  vi.advanceTimersByTime(5_999);
  expect(c.records).toHaveLength(1);
  vi.advanceTimersByTime(1);
  expect(c.records).toHaveLength(0);
  c.sync("resource", [{ ...error, message: "New error" }]);
  c.dispose();
  expect(vi.getTimerCount()).toBe(0);
  c.sync("resource", [error]);
  expect(c.records).toHaveLength(0);
});
it("bounds visible notifications and session history and retains full long details", () => {
  const c = center();
  c.sync(
    "batch",
    Array.from({ length: 110 }, (_, i) => ({
      ...error,
      id: `notice:${i}`,
      message: "x".repeat(500),
    })),
  );
  expect(c.records).toHaveLength(4);
  expect(c.history).toHaveLength(100);
  expect(c.records[0]!.message).toHaveLength(218);
  expect(c.history[0]!.detail).toHaveLength(500);
});
it("executes only the explicitly selected toast action once", () => {
  const c = center(),
    run = vi.fn();
  c.sync("resource", [{ ...error, action: { label: "View details", run } }]);
  expect(run).not.toHaveBeenCalled();
  c.activate(error.id);
  c.activate(error.id);
  expect(run).toHaveBeenCalledOnce();
  expect(c.records).toHaveLength(0);
});
