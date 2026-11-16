# Workspace activity preview

## LM-FEED-001 — Filtered virtual activity timeline

**Requirement.** The reviewed application shell MUST present Activity as a lazy, virtualized cross-repository timeline through injected live or disposable fixture ports.

Repository branch-status filters constrain both remote events and current observations. An explicitly restricted empty repository scope returns no events or provider requests; it never falls back to all repositories.

### Acceptance details

- Workspace and PR activity share an avatar/byline/body renderer with GitHub links, icon-only details and colored status chips; explicit success/failure events have subtle theme tints and icon/text labels, neutral events remain unboxed, and repository icon buttons open the inbox with only that repository selected.
- A compact fixed header puts multi-event types with leading icons and trailing ticks beside an accent-when-open filter-icon toggle; search/repository/status filters start hidden and retain values, changed queries reset paging and scroll, and returning to equivalent queries preserves matching rows and position.
- Injected read ports supply cursor pages, deduplicate IDs, reject stale/disposed responses and retain rows during refresh/failure with retry and Load older controls; live ports lazily merge repository event streams by timestamp, filter before emission, label snapshots as current observations and disclose partial coverage without inventing history or global totals.
- Variable-height virtual rows mount a bounded range and request pages near the edge, while a pinned date follows the first visible event day; shell/component stories cover long feeds, filters, navigation, paging, retry and light/dark/narrow layouts while automatic stories remain fixture-only and authenticated live activity stays token-partitioned, read-only and subject to existing offline/disposal boundaries.
