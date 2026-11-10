# Controller and ports

## LM-CTRL-001 — Host-owned controller and injected ports

**Requirement.** MaintenanceController MUST own presentation state and accept replaceable typed read
and command ports; the host owns construction and disposal.

### Acceptance details

- Reads supply snapshots/details; commands bind to a PR SHA, run attempt or deployment identity and return completed, accepted, rejected or uncertain.
- Mount, selection, filters and refresh never write; only explicit confirmation submits a command, at most once while it is pending.
- Refresh/detail races and disposal reject stale responses; Refresh failures retain prior content; Changed command targets require renewed confirmation.
- Credentials stay outside snapshots/args/preferences; production source never imports catalog fixtures; Uncertain commands are retained without replay.
