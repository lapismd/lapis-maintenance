# Workspace activity preview

## LM-FEED-001 — Filtered virtual activity timeline

**Requirement.** The reviewed Storybook shell MUST present its main Activity view as a lazy, virtualized cross-repository timeline using local production components and disposable fixture reads.

### Acceptance details

- Workspace and PR activity share an avatar/byline/body renderer with GitHub links, icon-only details and colored status chips; explicit success/failure events have subtle theme tints and icon/text labels, neutral events remain unboxed, and repository icon buttons open the inbox with only that repository selected.
- A compact fixed header puts multi-event types with leading icons and trailing ticks beside an accent-when-open filter-icon toggle; search/repository/status filters start hidden and retain values, changed queries reset paging and scroll, and returning to equivalent queries preserves matching rows and position.
- Injected read ports supply cursor pages; the controller prevents duplicate reads, deduplicates IDs, rejects stale/disposed responses and retains matching rows during refresh/failure, with explicit loading, empty, partial-page error, retry and manual Load older controls.
- Variable-height virtual rows mount a bounded range and request pages near the edge, while a pinned date follows the first visible event day; shell/component stories cover long feeds, filters, navigation, paging, retry and light/dark/narrow layouts without credentials, persistence, real GitHub reads/writes, deployment or sibling changes.
