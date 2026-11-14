import { snapshotFixture } from "../fixtures";
import { reviewAvatars } from "../review/avatars";
import {
  activityKinds,
  type ActivityEvent,
  type ActivityQuery,
  type ActivityReadPort,
} from "../../src/maintenance/activity/types";
export type ActivityScenario =
  | "populated"
  | "empty"
  | "error"
  | "page-error"
  | "loading"
  | "refreshing";
export class MemoryActivityPort implements ActivityReadPort {
  calls: { query: ActivityQuery; cursor?: string }[] = [];
  readonly events: ActivityEvent[];
  constructor(
    readonly scenario: ActivityScenario = "populated",
    private delay = 80,
  ) {
    const items = snapshotFixture().items;
    const kinds = Object.keys(activityKinds) as (keyof typeof activityKinds)[];
    this.events = Array.from({ length: 240 }, (_, index) => {
      const item = items[index % items.length]!;
      const kind = kinds[index % kinds.length]!;
      return {
        id: `event-${index}`,
        itemId: item.id,
        repository: item.repository,
        status: item.status,
        kind,
        outcome:
          kind === "check" || kind === "workflow"
            ? index % 2 === 0
              ? "success"
              : "failure"
            : undefined,
        actor: index % 3 === 0 ? "stevejuma" : "lapis-automation[bot]",
        avatarUrl:
          index % 3 === 0 ? reviewAvatars.maintainer : reviewAvatars.automation,
        title: {
          "pull-request": "opened a pull request",
          review: "reviewed a pull request",
          check:
            index % 2 === 0
              ? "reported passing checks"
              : "reported failing checks",
          workflow:
            index % 2 === 0
              ? "completed a workflow successfully"
              : "reported a failed workflow",
          deployment: "requested an environment review",
          comment: "commented on a pull request",
          commit: "pushed a commit",
        }[kind],
        body:
          index % 9 === 0
            ? `${item.title}. ${item.reasons.join(" ")} The current revision is ready for inspection; repository policies remain authoritative.`
            : item.title,
        time: index ? `${index * 15} minutes ago` : "Just now",
        url: item.url,
        createdAt: new Date(
          Date.parse("2026-11-14T09:45:00Z") - index * 900_000,
        ).toISOString(),
      };
    });
  }
  async readPage(
    query: ActivityQuery,
    cursor: string | undefined,
    signal: AbortSignal,
  ) {
    this.calls.push({ query: structuredClone(query), cursor });
    await new Promise<void>((resolve, reject) => {
      signal.throwIfAborted();
      const timer = setTimeout(
        done,
        this.scenario === "loading" ||
          (this.scenario === "refreshing" && this.calls.length > 1)
          ? 2 ** 30
          : this.delay,
      );
      function done() {
        signal.removeEventListener("abort", abort);
        resolve();
      }
      function abort() {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      }
      signal.addEventListener("abort", abort, { once: true });
    });
    if (this.scenario === "error" && this.calls.length === 1)
      throw Error("Activity is temporarily unavailable. Retry to continue.");
    if (this.scenario === "page-error" && cursor && this.calls.length === 2)
      throw Error(
        "Older activity could not be loaded. Your current events are retained.",
      );
    const filtered =
      this.scenario === "empty"
        ? []
        : this.events.filter(
            (event) =>
              (!query.repositories.length ||
                query.repositories.includes(event.repository)) &&
              (!query.statuses.length ||
                query.statuses.includes(event.status)) &&
              (!query.kinds.length || query.kinds.includes(event.kind)) &&
              (!query.search ||
                `${event.actor} ${event.title} ${event.body} ${event.repository}`
                  .toLowerCase()
                  .includes(query.search)),
          );
    const offset = Number(cursor ?? 0),
      end = offset + 40;
    return {
      events: structuredClone(filtered.slice(offset, end)),
      nextCursor: end < filtered.length ? String(end) : undefined,
      total: filtered.length,
    };
  }
}
