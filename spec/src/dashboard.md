# Dashboard

## LM-UI-001 — Complete maintenance screen

**Requirement.** The dashboard MUST use public Design Core AppShell and controls for a responsive,
accessible action inbox with light and dark themes.

The existing Operations view implements LM-OPS-001 with an attention-count navigation badge and fixture-only stories, showing open issues with natural GitHub links alongside current PR/main failure monitoring. Compatibility projects remain human decisions; navigation and reads perform no writes.

Repository settings include monitoring-only defaults from LM-GH-003, retain consumer hold explanations, and distinguish unavailable discovery from an empty healthy repository list.

Rapid authenticated remounts retain their persistent cache through the host-owned connection handoff, preserving cached content rather than selecting a transient fallback.

Running work has its own Kanban lane; Activity retains completed and cancelled items.

PR overview descriptions follow LM-PR-001's semantic full-width Markdown contract,
using public renderer layout options rather than centered note styling.

### Acceptance details

- The production host composes live ports, GitHub outcome labels, settings, PWA controls, profile/avatar and disconnect; login startup is bounded and late activation preserves input; hash navigation retains PR/tab and board filters across reload/back; navigation exposes Inbox, Activity, Pull Requests, Workflows and Approvals, transparent sidebar/resize handle, expandable ellipsized repositories, one collapsed Command View picker, centered logo and collapsed-icon tooltips.
- Four summary tiles stay on one row and reflect active repository, branch-action, query, status and view filters; mobile/desktop disclosure choices persist, a filter-icon toggle starts closed and retains filters with accent when open, summary bottom spacing is larger when closed, repository options have vertical spacing, the breadcrumb truncates before bounded status/time, and status opens a counted timeline with retry and motion-aware indicators.
- Attention prioritizes approval waits, current failures, reviews and blockers before drafts, cancelled and running work, while unavailable data never appears healthy; category chips retain a small inset from the top of their card, Activity count accents retain readable contrast, and long board lanes use Design Core's measured viewport rendering without mounting every card; empty lanes start collapsed across views and filter changes, remain expandable, and never inherit the locked approval anchor.
- Cached boards retain motion-aware card refresh indicators; selection opens/updates the inspector with immediate known summaries, retained details and disabled pending actions; tablet panes remain adjacent, phones compact navigation, and long titles/review summaries wrap within the pane; refresh/GitHub controls use neutral hover and keyboard focus, sidebar check groups start collapsed per selection; shared panels retain square headers, fixed icon actions, horizontal descriptions and check/job/workflow links; empty checks start collapsed and pending summaries never invent results.

## LM-UI-002 — Storybook review boundary

**Requirement.** Slice 1 MUST demonstrate the production screen and controller with isolated,
disposable in-memory ports, without real credentials or network effects.

### Acceptance details

- Scenarios cover populated, loading, refreshing, empty, disconnected, partial-access, rate-limit, stale-target and uncertain-result states, plus a fixture-only 130-card wide shell and standalone board for manual fullscreen scroll/hover diagnosis without GitHub, credentials or persistent caches.
- Fixtures cover dependencies, compatibility drafts, versioning, registry publication, failed builds, protected approvals and explicit repository holds; R1 previews repository-owned PR workspace with a compact title/status header, overview, inspector, actions, approval, activity and linked-check components with files linked to GitHub through complete-screen and standalone fixture stories, with a virtual workspace timeline under LM-FEED-001 and live integration awaiting separate review under LM-PR-001.
- Simulated connections, permissions and outcomes exercise real controls with one-click action activation and required-input forms, pending-review explanations and merge enabled only after refreshed eligibility.
- Read-only browser fixtures distinguish query-only GraphQL POSTs from explicitly activated mutations; type, controller, Storybook interaction/accessibility and static build checks pass before slice review; Slice 2 additionally exposes a manual local-development production-app story with login, cache and disconnect, excluded from static builds and automated runs, without token args or play functions.

## LM-UI-003 — Shared detail panels and component stories

**Requirement.** Every maintenance view MUST compose the reviewed production components,
including shared forge frames and grouped checks, without parallel private implementations.

### Acceptance details

- PR, workflow and deployment details use public RepositoryForgePanel for their border, disclosure, float/dock controls and theme-aware floating content, while PRs retain RepositoryPullRequest and its merge footer.
- Live checks compose public RepositoryChecks with status grouping, independently collapsible groups, summary ring, descriptions, revision/completeness information and explicit refresh; the isolated LM-PR-001 follow-up may use one local linked-check presentation across its preview views, composing public ForgePanel/Collapsible controls without dependency changes.
- PR merge controls remain visible but disabled until eligible, workflows associated with exactly one open PR at the same SHA use that PR target, standalone or ambiguous runs never invent merge authority, shared merge/auto-merge controls appear in PR and linked detail views without duplicate footer controls.
- Standalone stories render the production toolbar, inbox, inspector, checks, PR review, board/activity, filters, summary, navigation, profile, actions, required-input forms, repository picker/settings, token login, installation/update controls and offline reconnect shell, with wrappers owning only disposable controllers and simulated ports.

## LM-UI-004 — Repository branch-action badges and filtering

**Requirement.** Repository navigation MUST show an icon-only default-branch Actions summary and filter repositories and views by that independent status.

### Acceptance details

- Align theme-aware success/failure/pending/unknown icons at each repository row's right edge, preserving ellipsis and readable accessible status/branch descriptions; collapsed navigation retains one searchable repository picker with the same badges and multi-select branch-status filter.
- Apply branch-status selection to repository choices, board items, Operations and workspace activity independently of card statuses; empty matches stay empty, explicit repository selections persist, clear resets filters and hash navigation restores branch filters across PR views and reloads without writes.
- The Run workflow repository field uses a searchable Command View with keyboard selection and a selected tick; changing repository resets workflow/ref/input discovery and never dispatches, and pending execution disables selection.
