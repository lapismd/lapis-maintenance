# Workspace activity preview

## LM-FEED-001 — Filtered virtual activity timeline

**Requirement.** The reviewed Storybook shell MUST present its main Activity view as a lazy, virtualized cross-repository timeline using local production components and disposable fixture reads.

### Acceptance details

- Activity navigation opens a timeline using the same actor/avatar/byline/body component as PR activity, with repository/status context, timestamps, GitHub event links and optional item details, while Inbox and other board views retain their existing presentation.
- Fixed header controls combine search, multiple repositories/statuses and multiple event types; changed filters reset the feed and cursor, return visits preserve matching loaded rows/scroll, and an empty filtered result, loading, refresh, pagination error and retry remain explicit.
- An injected read port supplies cursor pages; the controller prevents duplicate page reads, deduplicates events, rejects stale query/disposed responses and retains matching rows on refresh/failure, while the viewport measures variable-height rows, mounts only a bounded visible range and requests another page near its loaded edge.
- Fixture stories cover the complete shell and standalone feed, long lists, filter/navigation interactions, incremental loading, retry and light/dark/narrow layouts; credentials, persistence, real GitHub reads/writes, deployment and sibling changes remain outside this UI review.
