# Dashboard

## LM-UI-001 — Complete maintenance screen

**Requirement.** The dashboard MUST use public Design Core AppShell and controls for a responsive,
accessible action inbox with light and dark themes.

### Acceptance details

- The live host bounds login startup and preserves unsent input after late worker activation; hash navigation preserves the selected view across reload/back, and left navigation exposes Inbox, Activity, Pull Requests, Workflows and Approvals over one dataset, with authenticated profile/avatar, transparent sidebar and right resize handle, expandable repositories with ellipsized names and full-name hover labels, one collapsed Command View picker, centered logo and collapsed-icon tooltips.
- Fixed summary/filters retain their mobile-collapsed and desktop-expanded disclosure choices; the breadcrumb shrinks/truncates before the status panel, freshness displays time without a Snapshot prefix, and the bounded status line remains visible and opens its counted timeline with retry and reduced-motion-aware animation.
- Attention prioritizes approval waits, current failures, reviews and blockers before drafts, cancelled and running work, while unavailable data never appears healthy; category chips retain a small inset from the top of their card, Activity count accents retain readable contrast, and long board lanes use Design Core's measured viewport rendering without mounting every card.
- Cached boards persist during refresh with accessible, reduced-motion-aware per-card indicators; card activation opens or updates the joined inspector; tablets retain adjacent panes and phones compact navigation; inspectors immediately show known title, status and reasons while full cached details load, then retain matching content with refresh/failure feedback and disabled pending actions; preserve header refresh/GitHub controls, shared panels, bounded square-group checks, fixed actions and horizontal descriptions; empty checks start collapsed, and pending summaries never invent check results.

## LM-UI-002 — Storybook review boundary

**Requirement.** Slice 1 MUST demonstrate the production screen and controller with isolated,
disposable in-memory ports, without real credentials or network effects.

### Acceptance details

- Scenarios cover populated, loading, refreshing, empty, disconnected, partial-access, rate-limit, stale-target and uncertain-result states, plus a fixture-only 130-card wide shell and standalone board for manual fullscreen scroll/hover diagnosis without GitHub, credentials or persistent caches.
- Fixtures cover dependencies, compatibility drafts, versioning, registry publication, failed builds, protected approvals and explicit repository holds.
- Simulated connections, permissions and outcomes exercise real controls with explicit action confirmation, pending-review explanations and merge enabled only after refreshed eligibility.
- Type, controller, Storybook interaction/accessibility and static build checks pass before slice review; Slice 2 additionally exposes a manual local-development production-app story with login, cache and disconnect, excluded from static builds and automated runs, without token args or play functions.

## LM-UI-003 — Shared detail panels and component stories

**Requirement.** Every maintenance view MUST compose the reviewed production components,
including shared forge frames and grouped checks, without parallel private implementations.

### Acceptance details

- PR, workflow and deployment details use public RepositoryForgePanel for their border, disclosure, float/dock controls and theme-aware floating content, while PRs retain RepositoryPullRequest and its merge footer.
- All checks compose public RepositoryChecks with status grouping, independently collapsible groups, summary ring, descriptions, revision/completeness information and explicit refresh.
- PR merge controls remain visible but disabled until eligible, workflows associated with exactly one open PR at the same SHA use that PR target, standalone or ambiguous runs never invent merge authority, and no duplicate merge button appears in the inspector footer.
- Standalone stories render the production toolbar, inbox, inspector, checks, PR review, board/activity, filters, summary, navigation, profile, actions, confirmation, repository picker/settings, token login, installation/update controls and offline reconnect shell, with wrappers owning only disposable controllers and simulated ports.
