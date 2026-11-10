# Dashboard

## LM-UI-001 — Complete maintenance screen

**Requirement.** The dashboard MUST use public Design Core AppShell and controls for a responsive,
accessible action inbox with light and dark themes.

### Acceptance details

- Left navigation exposes Inbox, Pull Requests, Workflows and Approvals over one dataset; main and optional details use the canonical shell topology.
- Search, repository/status filters, counts, freshness, refresh, reasons, category, age and GitHub links are usable by keyboard and at narrow widths.
- Priority is approval waits, current failures, review requests and blockers, followed by drafts, cancelled and running work; unavailable is never healthy.
- Detail panels expose checks/review/workflow/approval information and explicitly confirmed actions with visible results.

## LM-UI-002 — Storybook review boundary

**Requirement.** Slice 1 MUST demonstrate the production screen and controller with isolated,
disposable in-memory ports, without real credentials or network effects.

### Acceptance details

- Scenarios cover populated, loading, refreshing, empty, disconnected, partial-access, rate-limit, stale-target and uncertain-result states.
- Fixtures cover dependencies, compatibility drafts, versioning, registry publication, failed builds, protected approvals and explicit repository holds.
- Simulated connections, permissions and action outcomes exercise real controls.
- Type, controller, Storybook interaction/accessibility and static build checks pass before committing and stopping for user approval.
