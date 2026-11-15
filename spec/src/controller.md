# Controller and ports

## LM-CTRL-001 — Host-owned controller and injected ports

**Requirement.** MaintenanceController MUST own presentation state and accept replaceable typed read
and command ports; the host owns construction and disposal.

Repository discovery policy under LM-GH-003 affects read coverage only; adding a monitored repository cannot prepare a command, remove a consumer hold or bypass the command adapter's fresh authority checks.

### Acceptance details

- Reads supply snapshots/details with PR identity and workflow Actions links; commands bind to a PR SHA, run attempt or deployment identity, with check completeness independent of unrelated resource gaps and return completed, accepted, rejected or uncertain; the selected card remains available for immediate inspector presentation while ports load full cached details; subsequent cached progress replaces that summary and preserves disabled actions until the detail read settles.
- Kanban board/activity navigation, mount, selection, filters and refresh never write; virtualized lanes retain full controller snapshots, counts and selected details; header disclosure only changes local presentation, retaining controller filters without fetching; activity uses each item's latest update with the same shared filters, merge-method selection never prepares or sends a command; auto-merge scheduling/cancellation uses the shared identified-target confirmation, and only explicit confirmation submits a command, at most once while pending, with one command-adapter preflight and cancellation through disposal.
- Refresh/detail races and disposal reject stale responses, including cached progress, while progressive snapshots update independently during initial and background refresh; detail refresh/failure retains matching cached content with explicit feedback, affected-repository updates preserve unrelated items, and changed command targets require renewed confirmation.
- Credentials stay outside snapshots/args/preferences and data caches; hosts own remembered sessions, bounded worker bootstrap and cache lifetime, read-only restore preserves controller filters and rejects commands before authentication, production never imports fixtures, uncertain writes are not replayed, and review/activity controllers label effects and own independent resources, cursor paging, race/disposal guards and retained data under LM-PR-001, LM-PR-002 and LM-FEED-001, with live ports constructed and retired by the authenticated host.
