# Controller and ports

## LM-CTRL-001 — Host-owned controller and injected ports

**Requirement.** MaintenanceController MUST own presentation state and accept replaceable typed read
and command ports; the host owns construction and disposal.

### Acceptance details

- Reads supply snapshots/details; commands bind to a PR SHA, run attempt or deployment identity and return completed, accepted, rejected or uncertain; the selected card remains available for immediate inspector presentation while ports load full cached details; subsequent cached progress replaces that summary and preserves disabled actions until the detail read settles.
- Kanban board/activity navigation, mount, selection, filters and refresh never write; header disclosure only changes local presentation, retaining controller filters without fetching; activity uses each item's latest update with the same shared filters, and only explicit confirmation submits a command, at most once while it is pending.
- Refresh/detail races and disposal reject stale responses, including cached progress, while progressive snapshots update independently during initial and background refresh; detail refresh/failure retains matching cached content with explicit feedback, affected-repository updates preserve unrelated items, and changed command targets require renewed confirmation.
- Credentials stay outside snapshots/args/preferences and data caches; the host owns the remembered session, bounded asset-worker bootstrap/lifecycle and cache lifetime; read-only restore ports preserve controller/filter state while attaching authenticated live ports, and reject command validation before authentication; production source never imports catalog fixtures; uncertain commands are retained without replay.
