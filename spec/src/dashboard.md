# Dashboard

## LM-UI-001 — Complete maintenance screen

**Requirement.** The dashboard MUST use public Design Core AppShell and controls for a responsive,
accessible action inbox with light and dark themes.

### Acceptance details

- Left navigation exposes Inbox, Activity, Pull Requests, Workflows and Approvals over one dataset; main and optional details use the canonical shell topology with Design Core Kanban board and activity views, Agent UI public PR presentation and JJ Store-style grouped navigation and the shared profile menu footer over a transparent left sidebar, preserving shell colour and the Lapis logo.
- Search, the Command View multi-select repository picker, status filter, counts, freshness and borderless icon-only refresh stay in the fixed header; reasons, category, age and GitHub links are usable by keyboard and at narrow widths.
- Priority is approval waits, current failures, review requests and blockers, followed by drafts, cancelled and running work; unavailable is never healthy.
- Detail panels expose checks/review/workflow/approval information and explicitly confirmed actions with visible results; checks retain Repository UI's compact divided rows, status icons, expandable summary and revision; the attached inspector joins main with a divider, its header contains the icon-only named GitHub link and its fixed footer contains actions while details scroll independently.

## LM-UI-002 — Storybook review boundary

**Requirement.** Slice 1 MUST demonstrate the production screen and controller with isolated,
disposable in-memory ports, without real credentials or network effects.

### Acceptance details

- Scenarios cover populated, loading, refreshing, empty, disconnected, partial-access, rate-limit, stale-target and uncertain-result states.
- Fixtures cover dependencies, compatibility drafts, versioning, registry publication, failed builds, protected approvals and explicit repository holds.
- Simulated connections, permissions and action outcomes exercise real controls; eligible PRs show Merge in the fixed footer and pending reviews explain why merge is disabled, with simulated approval enabling merge only after refreshed eligibility.
- Type, controller, Storybook interaction/accessibility and static build checks pass before committing and stopping for user approval.
