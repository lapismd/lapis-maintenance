# Maintenance review follow-up

## LM-PR-001 — Local Storybook review workspace

**Requirement.** R1 MUST demonstrate the proposed PR, checks, activity and approval UI with repository-owned production components/controllers and disposable in-memory ports before live integration.

### Acceptance details

- The established AppShell/board/inspector remains the navigation context; Open PR view enters main-panel Overview, Checks and Activity tabs with a direct changed-files link to GitHub, and Back retains board filters and selection, with light/dark and narrow layouts; an icon-only circular Back control preserves that context, while All repositories and repository breadcrumbs return to the inbox with the corresponding repository filter and close the inspector.
- Shared local components provide linked grouped collapsible checks, PR merge controls, paginated Community-style activity with actor avatars/initials and unboxed details, and distinct fork-workflow/environment reviews with confirmation and eligibility-checking, reviewer/timer-wait, denied/error/accepted/stale/uncertain feedback; dialogs retain accessible target content while closing, inspector approval footers have a separator, PR metadata has a right-aligned GitHub header icon, and description/metadata/approval bodies use white light-mode and matching dark-mode surfaces.
- Hosts construct/dispose ports and controllers; independently loaded resources reject stale responses and retain useful content during refresh; fixtures simulate every effect without credentials, network, persistence or real writes, and no live application or sibling package integration is changed.
- Complete-screen and standalone component stories exercise production components with keyboard/accessibility, focused controller tests, repository validation/static builds and cold populated browser review, remaining visual-pending until user approval.

## LM-ACT-002 — Precise workflow and environment action authority

**Requirement.** Planned R2 MUST distinguish fork workflow approval and environment review using fresh GitHub authority and identified targets.

### Acceptance details

- Fork approval checks status/conclusion, public-fork origin, unambiguous current PR/head identity and run attempt; environment approve/reject revalidates the pending environment and actor eligibility.
- Each disabled action explains its actual blocker, unrelated resource failures do not remove valid authority, and GitHub rejection details distinguish Actions and Deployments permissions without replaying uncertain writes.
- Workflow/job/check titles and results link to actual targets, retaining explicit mutation confirmation and card-to-inspector navigation; manual workflow dispatch remains planned.

## LM-GH-002 — Independently refreshed efficient resources

**Requirement.** Planned R3 MUST reduce redundant GitHub reads while preserving cache isolation, coverage and current-target command validation.

### Acceptance details

- Lightweight PR summaries use bounded read-only GraphQL batches, scoped partial-error/fallback handling and the shared limiter; complete optional resources load independently and preserve useful cached content.
- Intent prefetch is delayed, bounded and shares reads without cancellation coupling; persistence and invalidation reject stale writes, while one authoritative action-specific preflight remains immediately before commands.
- Controlled acceptance proves fresh reopening uses zero GitHub requests and a 20-PR cold inventory uses at least 50% fewer requests, alongside rate-limit, revision, session and disposal coverage.

## LM-PR-002 — Live PR workspace resources

**Requirement.** Planned R4 MUST connect the reviewed workspace to independently cached GitHub activity while keeping file browsing and diffs on GitHub.

### Acceptance details

- Read activity with pagination and load it lazily; changed files open through a normal GitHub link without local file reads, patch storage or an embedded viewer.
- Hash navigation identifies the PR and tab, Back restores the board, and token-partitioned cache/offline boundaries remain intact; inline review drafts/comments and bulk operations stay deferred.
