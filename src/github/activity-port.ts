import type {
  ActivityEvent,
  ActivityPage,
  ActivityQuery,
  ActivityReadPort,
} from "../maintenance/activity/types";
import type { MaintenanceSnapshot } from "../maintenance/types";
import type { GithubTransport } from "./transport";
import { GithubError } from "./transport";
import {
  eventOf,
  observations,
  type RepositoryEvent,
} from "./activity-mapping";
import { ResourceCache } from "../cache/resource-cache";
import type { ResponseCache } from "../cache/response-cache";
interface Position {
  page: number;
  offset: number;
  done?: boolean;
}
interface Cursor {
  query: string;
  positions: Record<string, Position>;
}
export class GithubActivityPort implements ActivityReadPort {
  #resources: ResourceCache;
  constructor(
    private client: GithubTransport,
    private snapshot: () => MaintenanceSnapshot | null,
    cache?: ResponseCache,
  ) {
    this.#resources = new ResourceCache(cache);
  }
  async readPage(
    query: ActivityQuery,
    cursor: string | undefined,
    signal: AbortSignal,
    options: { force?: boolean } = {},
  ): Promise<ActivityPage> {
    const repositories = (this.snapshot()?.repositories ?? [])
      .map((r) => r.repository)
      .filter(
        (r) => !query.repositories.length || query.repositories.includes(r),
      )
      .sort();
    const identity = JSON.stringify({ query, repositories });
    let state: Cursor = {
      query: identity,
      positions: Object.fromEntries(
        [...repositories, "observations"].map((r) => [
          r,
          { page: 1, offset: 0 },
        ]),
      ),
    };
    if (cursor) {
      state = JSON.parse(cursor);
      if (
        state.query !== identity ||
        Object.keys(state.positions).some(
          (r) => r !== "observations" && !repositories.includes(r),
        )
      )
        throw new GithubError(0, "Activity filters changed. Refresh activity.");
    }
    return this.#resources.read(
      `activity:v1:${identity}:${cursor ?? "first"}`,
      () => 0,
      async (readOptions, signal) => {
        const positions = structuredClone(state.positions),
          coverage: string[] = [],
          streams = new Map<string, ActivityEvent[]>();
        const matches = (e: ActivityEvent) =>
          (!query.kinds.length || query.kinds.includes(e.kind)) &&
          (!query.statuses.length || query.statuses.includes(e.status)) &&
          (!query.search ||
            `${e.actor} ${e.title} ${e.body} ${e.repository}`
              .toLowerCase()
              .includes(query.search));
        // Bounded rounds permit sparse filters without exhausting every repository's feed.
        for (let round = 0; round < 3; round++) {
          await Promise.all(
            Object.entries(positions).map(async ([repository, pos]) => {
              if (pos.done || streams.get(repository)?.length) return;
              if (repository === "observations") {
                const items = observations(this.snapshot())
                  .filter((e) => repositories.includes(e.repository))
                  .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
                  .slice(pos.offset);
                streams.set(repository, items);
                if (!items.length) pos.done = true;
                return;
              }
              try {
                const page = await this.client.page<RepositoryEvent>(
                  `/repos/${repository}/events?per_page=100&page=${pos.page}`,
                  signal,
                  readOptions,
                );
                const items = page.items
                  .slice(pos.offset)
                  .map((e) => eventOf(repository, e))
                  .map((e, i) => ({ event: e, index: pos.offset + i }));
                const candidates = items.filter(
                  (e) => e.event && matches(e.event),
                );
                if (candidates.length)
                  streams.set(
                    repository,
                    candidates.map((e) => ({
                      ...e.event!,
                      id: `${e.event!.id}|${pos.page}:${e.index}`,
                    })),
                  );
                else if (page.next && pos.page < 3) {
                  pos.page++;
                  pos.offset = 0;
                } else pos.done = true;
              } catch (error) {
                signal.throwIfAborted();
                if (error instanceof GithubError && error.status === 401)
                  throw error;
                coverage.push(
                  `${repository}: ${error instanceof Error ? error.message : "Events unavailable"}`,
                );
                pos.done = true;
              }
            }),
          );
          if ([...streams.values()].some((s) => s.length)) break;
        }
        const selected: ActivityEvent[] = [];
        while (selected.length < 50) {
          const next = [...streams.entries()]
            .filter(([, items]) => items.length)
            .sort((a, b) =>
              b[1][0]!.createdAt.localeCompare(a[1][0]!.createdAt),
            )[0];
          if (!next) break;
          const [repository, items] = next,
            event = items.shift()!,
            pos = positions[repository]!;
          if (repository === "observations") {
            pos.offset++;
            if (matches(event)) selected.push(event);
          } else {
            const match = /\|(\d+):(\d+)$/.exec(event.id)!;
            pos.page = Number(match[1]);
            pos.offset = Number(match[2]) + 1;
            selected.push({ ...event, id: event.id.replace(/\|\d+:\d+$/, "") });
          }
        }
        // Re-read exhausted pages from their cached validator to advance across remote boundaries.
        for (const [repository, pos] of Object.entries(positions)) {
          if (repository === "observations") {
            if (!streams.get(repository)?.length) pos.done = true;
          } else if (!streams.get(repository)?.length && !pos.done) {
            const page = await this.client.page<RepositoryEvent>(
              `/repos/${repository}/events?per_page=100&page=${pos.page}`,
              signal,
              readOptions,
            );
            if (page.next && pos.page < 3) {
              pos.page++;
              pos.offset = 0;
            } else pos.done = true;
          }
        }
        return {
          events: selected,
          total: selected.length,
          totalKnown: false,
          coverage: [
            "Repository events are limited to GitHub’s available recent feed; workflow rows are current observations.",
            ...coverage,
          ],
          nextCursor: Object.values(positions).some((p) => !p.done)
            ? JSON.stringify({ query: identity, positions })
            : undefined,
        };
      },
      signal,
      options,
    );
  }
  dispose() {
    this.#resources.dispose();
  }
  drain() {
    return this.#resources.drain();
  }
}
