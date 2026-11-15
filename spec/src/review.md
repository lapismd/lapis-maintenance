# Maintenance review follow-up

## LM-PR-001 — Local Storybook review workspace

**Requirement.** R1 MUST demonstrate the proposed PR, checks, activity and approval UI with repository-owned production components/controllers and disposable in-memory ports before live integration.

### Acceptance details

- The AppShell/board/inspector provides navigation into Overview, Checks and Activity tabs with Files linked to GitHub; circular Back retains filters/selection, repository breadcrumbs and sidebar selection return to a singly filtered inbox, Open PR view has an expand icon, compact headings put the PR number beside its title and status in the toolbar, and breadcrumb hover targets retain padding.
- Shared local components provide grouped linked checks with collapsed sidebar groups, merge controls, Community-style avatar activity under LM-FEED-001 and distinct fork-workflow/environment reviews with confirmation and eligibility/wait/denied/error/accepted/stale/uncertain states; dialogs retain target content while closing, inspector footers have separators, description/metadata/approval bodies are white in light mode and theme-aware in dark, details headers match description headers with right-aligned GitHub/count controls, neutral GitHub hover backgrounds and keyboard focus rings, approval counts use accent backgrounds, and tabs have visible bordered hover states.
- One split merge control has non-wrapping method options and prepares confirmation only on action; shared PR/inspector controls enable or disable auto-merge with current status and method; merge availability uses an open non-draft PR and merge permission independently of approval counts or review permission, confirmed commands can report repository-rule rejection without closing the PR or replaying, PR approval still requires checks, and action controls have suitable icons with accessible labels.
- Hosts construct/dispose controllers and fixture ports with independent resources, stale-response guards and retained refresh content; shell/component stories cover keyboard/accessibility, focused controller tests, checks, static builds and cold populated browser review without credentials, network, persistence, real writes or live adapter changes, with visual review retained and live integration authorized under R2–R4.

## LM-ACT-002 — Precise workflow and environment action authority

**Requirement.** Authorized R2 MUST distinguish fork workflow approval and environment review using fresh GitHub authority and identified targets.

### Acceptance details

- PR-run approval accepts verified public same-repository automation and fork PRs, checking status/conclusion, current PR/head/branch, base repository and run attempt; environment approve/reject revalidates the pending environment and GitHub actor eligibility without requiring the actor to have repository push permission.
- Each disabled action explains its actual blocker, unrelated resource failures do not remove valid authority, and GitHub rejection details distinguish Actions and Deployments permissions without replaying uncertain writes.
- Workflow/job/check titles and results link to actual targets, retaining explicit mutation confirmation and card-to-inspector navigation; manual workflow dispatch follows LM-REL-001.

## LM-GH-002 — Independently refreshed efficient resources

**Requirement.** Authorized R3 MUST reduce redundant GitHub reads while preserving cache isolation, coverage and current-target command validation.

### Acceptance details

- Lightweight PR summaries use bounded read-only GraphQL batches, scoped partial-error/fallback handling and the shared limiter; complete optional resources load independently and preserve useful cached content.
- Intent prefetch is delayed, bounded and shares reads without cancellation coupling; persistence and invalidation reject stale writes, while one authoritative action-specific preflight remains immediately before commands.
- Independent resource caches retain matching stale data during refresh, provide bounded synchronous warm previews, fence writes by resource/repository epoch and serialize persistence; denied/disposed reads clear or reject data and intent-prefetch shares provider work without cancellation coupling.
- Controlled acceptance proves fresh reopening uses zero GitHub requests and a 20-PR cold inventory uses at least 50% fewer requests, alongside rate-limit, revision, session and disposal coverage.

## LM-PR-002 — Live PR workspace resources

**Requirement.** Authorized R4 MUST connect the reviewed workspace to independently cached GitHub activity while keeping file browsing and diffs on GitHub.

The production review shell exposes the shared Operations view and its explicit batch confirmations under LM-OPS-001; existing individual controls remain available independently of coordinator evidence.

### Acceptance details

- Session-owned live adapters cache overview, current-head checks, pending approvals and paginated activity independently, showing warm previews synchronously and retaining stale content while revalidating; changed heads clear mismatched checks and optional failures do not remove unrelated capabilities.
- Read activity with pagination and load it lazily; changed files open through a normal GitHub link without local file reads, patch storage or an embedded viewer.
- Live feedback identifies GitHub effects while fixtures retain Preview labels; the production shell retains settings, PWA controls, theme/profile and disconnect; hash navigation identifies the PR and tab, Back restores the board, and token-partitioned cache/offline boundaries remain intact; inline review drafts/comments and bulk PR reviews stay deferred while limited confirmed batches follow LM-ACT-003.
