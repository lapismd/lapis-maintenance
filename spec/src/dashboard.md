# Dashboard

## LM-UI-001 — Complete maintenance screen

**Requirement.** The dashboard MUST use public Design Core AppShell and controls for a responsive,
accessible action inbox with light and dark themes.

### Acceptance details

- The production host composes live ports, GitHub outcome labels, settings, PWA controls, profile/avatar and disconnect; login startup is bounded and late activation preserves input; hash navigation retains PR/tab and board filters across reload/back; navigation exposes Inbox, Activity, Pull Requests, Workflows and Approvals, transparent sidebar/resize handle, expandable ellipsized repositories, one collapsed Command View picker, centered logo and collapsed-icon tooltips.
- Four compact summary tiles stay on one row; mobile/desktop disclosure choices persist, a filter-icon toggle starts closed and retains filters with accent when open, summary bottom spacing is larger when closed, repository options have vertical spacing, the breadcrumb truncates before bounded status/time, and status opens a counted timeline with retry and motion-aware indicators.
- Attention prioritizes approval waits, current failures, reviews and blockers before drafts, cancelled and running work, while unavailable data never appears healthy; category chips retain a small inset from the top of their card, Activity count accents retain readable contrast, and long board lanes use Design Core's measured viewport rendering without mounting every card; empty lanes start collapsed across views and filter changes, remain expandable, and never inherit the locked approval anchor.
- Cached boards retain motion-aware card refresh indicators; selection opens/updates the inspector with immediate known summaries, retained details and disabled pending actions; tablet panes remain adjacent, phones compact navigation, and long titles/review summaries wrap within the pane; refresh/GitHub controls use neutral hover and keyboard focus, shared panels retain square check groups, fixed icon actions, horizontal descriptions and check/job/workflow links; empty checks start collapsed and pending summaries never invent results.

## LM-UI-002 — Storybook review boundary

**Requirement.** Slice 1 MUST demonstrate the production screen and controller with isolated,
disposable in-memory ports, without real credentials or network effects.

### Acceptance details

- Scenarios cover populated, loading, refreshing, empty, disconnected, partial-access, rate-limit, stale-target and uncertain-result states, plus a fixture-only 130-card wide shell and standalone board for manual fullscreen scroll/hover diagnosis without GitHub, credentials or persistent caches.
- Fixtures cover dependencies, compatibility drafts, versioning, registry publication, failed builds, protected approvals and explicit repository holds; R1 previews repository-owned PR workspace with a compact title/status header, overview, inspector, actions, approval, activity and linked-check components with files linked to GitHub through complete-screen and standalone fixture stories, with a virtual workspace timeline under LM-FEED-001 and live integration awaiting separate review under LM-PR-001.
- Simulated connections, permissions and outcomes exercise real controls with explicit action confirmation, pending-review explanations and merge enabled only after refreshed eligibility.
- Read-only browser fixtures distinguish query-only GraphQL POSTs from confirmed mutations; type, controller, Storybook interaction/accessibility and static build checks pass before slice review; Slice 2 additionally exposes a manual local-development production-app story with login, cache and disconnect, excluded from static builds and automated runs, without token args or play functions.

## LM-UI-003 — Shared detail panels and component stories

**Requirement.** Every maintenance view MUST compose the reviewed production components,
including shared forge frames and grouped checks, without parallel private implementations.

### Acceptance details

- PR, workflow and deployment details use public RepositoryForgePanel for their border, disclosure, float/dock controls and theme-aware floating content, while PRs retain RepositoryPullRequest and its merge footer.
- Live checks compose public RepositoryChecks with status grouping, independently collapsible groups, summary ring, descriptions, revision/completeness information and explicit refresh; the isolated LM-PR-001 follow-up may use one local linked-check presentation across its preview views, composing public ForgePanel/Collapsible controls without dependency changes.
- PR merge controls remain visible but disabled until eligible, workflows associated with exactly one open PR at the same SHA use that PR target, standalone or ambiguous runs never invent merge authority, and no duplicate merge button appears in the inspector footer.
- Standalone stories render the production toolbar, inbox, inspector, checks, PR review, board/activity, filters, summary, navigation, profile, actions, confirmation, repository picker/settings, token login, installation/update controls and offline reconnect shell, with wrappers owning only disposable controllers and simulated ports.
