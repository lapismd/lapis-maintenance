import type { NotificationToastRecord } from "@lapismd/design-core/workspace/plugins/notifications";
export interface FeedbackNotice extends Omit<
  NotificationToastRecord,
  "action"
> {
  detail?: string;
  action?: { label: string; run: () => void };
}
export interface FeedbackLog extends NotificationToastRecord {
  detail: string;
}
/** Session-owned feedback policy; Design Core owns toast presentation and modal portals. */
export class FeedbackCenter {
  records = $state.raw<NotificationToastRecord[]>([]);
  history = $state.raw<FeedbackLog[]>([]);
  #active = new Map<string, Map<string, string>>();
  #published = new Map<string, string>();
  #actions = new Map<string, () => void>();
  #timers = new Map<
    string,
    {
      timer?: ReturnType<typeof setTimeout>;
      started: number;
      remaining: number;
    }
  >();
  #disposed = false;
  sync(scope: string, notices: readonly FeedbackNotice[], pending = false) {
    if (this.#disposed) return;
    const active = this.#active.get(scope) ?? new Map<string, string>();
    this.#active.set(scope, active);
    const present = new Set(notices.map((n) => n.id));
    if (!pending)
      for (const id of active.keys()) {
        if (!present.has(id)) active.delete(id);
      }
    for (const notice of notices) {
      const fingerprint = `${notice.severity}:${notice.id.startsWith("command:") ? notice.message : (notice.detail ?? notice.message)}`;
      active.set(notice.id, fingerprint);
      if (this.#published.get(notice.id) !== fingerprint) {
        this.#published.set(notice.id, fingerprint);
        this.#show(notice);
      }
    }
    for (const id of this.#published.keys())
      if (![...this.#active.values()].some((items) => items.has(id))) {
        this.#published.delete(id);
        this.dismiss(id);
      }
    while (this.#active.size > 200)
      this.#active.delete(this.#active.keys().next().value!);
  }
  #show(notice: FeedbackNotice) {
    this.dismiss(notice.id);
    const record: NotificationToastRecord = {
      id: notice.id,
      title: notice.title,
      severity: notice.severity,
      message:
        notice.message.length > 220
          ? `${notice.message.slice(0, 217)}…`
          : notice.message,
      action: notice.action
        ? { id: "activate", label: notice.action.label }
        : undefined,
    };
    this.history = [
      ...this.history.filter((n) => n.id !== notice.id),
      { ...record, detail: notice.detail ?? notice.message },
    ].slice(-100);
    this.records = [...this.records, record];
    if (notice.action) this.#actions.set(notice.id, notice.action.run);
    this.#timers.set(notice.id, { started: Date.now(), remaining: 10_000 });
    this.resume(notice.id);
    while (this.records.length > 4) this.dismiss(this.records[0]!.id);
  }
  dismiss(id: string) {
    clearTimeout(this.#timers.get(id)?.timer);
    this.#timers.delete(id);
    this.#actions.delete(id);
    this.records = this.records.filter((n) => n.id !== id);
  }
  activate(id: string) {
    const action = this.#actions.get(id);
    this.dismiss(id);
    action?.();
  }
  pause(id: string) {
    const clock = this.#timers.get(id);
    if (!clock?.timer) return;
    clearTimeout(clock.timer);
    clock.timer = undefined;
    clock.remaining = Math.max(
      0,
      clock.remaining - (Date.now() - clock.started),
    );
  }
  resume(id: string) {
    const clock = this.#timers.get(id);
    if (!clock || clock.timer || this.#disposed) return;
    clock.started = Date.now();
    clock.timer = setTimeout(() => this.dismiss(id), clock.remaining);
  }
  dispose() {
    this.#disposed = true;
    for (const id of this.#timers.keys()) this.dismiss(id);
    this.history = [];
    this.#active.clear();
    this.#published.clear();
  }
}
export const outcomeSeverity = (status: string) =>
  status === "uncertain" || status === "rejected"
    ? ("error" as const)
    : ("info" as const);
