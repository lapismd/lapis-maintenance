# Dashboard

## LM-UI-001 — Complete maintenance screen

**Requirement.** The dashboard MUST use public Design Core AppShell and controls for a responsive,
accessible action inbox with light and dark themes.

The selected light or dark theme is a versioned, non-sensitive local browser
preference. Startup restores only valid stored values before falling back to the
system preference, storage failures never block switching, and valid changes in
another tab synchronize without affecting credentials or cached GitHub data.

The counted session status control lives in a compact centred footer within the
main AppShell body rather than the toolbar. It retains retry, activity coverage,
live/fixture notices and its motion-aware status log while remaining outside the
scrolling view content.

The existing Operations view implements LM-OPS-001 with an attention-count navigation badge and fixture-only stories, showing open issues with natural GitHub links alongside current PR/main failure monitoring. Compatibility projects remain human decisions; navigation and reads perform no writes.

Operations labels its independently refreshed live GitHub state and coordinator
observation instead of presenting either as a universal current state. Generic
waiting copy is replaced with the most precise known condition, including
published-but-not-admitted releases and complete-coverage confirmation that no
open pull request exists. Every non-green row names the owner and next step;
safe contextual controls reuse existing refresh, navigation, approval and manual
workflow-dispatch surfaces, while unavailable evidence never invents an action.
When complete live coverage proves that no pull request and no current workflow
item exists, a coordinator hold MUST be labelled as blocked before PR creation
or automation inactive rather than as live held/pending work. Product, rollout
and exclusion policy stays visible without joining the live queue. A propagated
upstream action MUST target the attention item's owning repository, not the
downstream consumer, while channel and publisher-policy waits link their exact
policy source instead of suggesting an ineffective workflow rerun.

Automation decisions display the latest repository value in one compact row;
expansion reveals current evidence and at most one previous decision with its
status, time, source and identifiers, while search never resurrects superseded
rows and the section count reflects repositories rather than historical records.

Repository settings include monitoring-only defaults from LM-GH-003, retain consumer hold explanations, and distinguish unavailable discovery from an empty healthy repository list.

Rapid authenticated remounts retain their persistent cache through the host-owned connection handoff, preserving cached content rather than selecting a transient fallback.

Running work has its own Kanban lane; the live board and cached snapshots retain
the attention queue under LM-CACHE-001, including passing open PRs while omitting
resolved successful/cancelled workflows and preserving compact branch health.
Historical Activity loads on demand into a bounded session cache.

PR overview descriptions follow LM-PR-001's semantic full-width Markdown contract,
using public renderer layout options rather than centered note styling.

Transient repository/session errors, cached-resource refresh failures and command
outcomes use the public Design Core toast host, without inline duplicate banners.
An unresolvable resource reference is described as such; permission guidance is
reserved for an access-denied response.
Toasts are dismissible and pause their ten-second expiry on hover/focus; their
full details remain in the session status log. Repeated background failures are
deduplicated until recovery, command request IDs identify outcomes across panes,
and notification memory is bounded to four visible and 100 log records. Empty
states, loading indicators, contextual validation and eligibility reasons remain
attached to their controls; toast actions only retry reads or open details/links.
Toast action buttons use the shared secondary variant with a visible themed
background at rest and a distinct hover state.

Expanded sidebar branding retains its original logo/text alignment and centres
only a small bare short Git commit link directly below the Maintenance text,
with a padded sidebar-style hover background; it opens the exact full build commit on GitHub, with the full SHA
available on hover. Collapsed navigation omits the label, and source archives
without commit metadata disclose dev without inventing a commit link.

The LM-OPS-001 read-only SDK view labels its timeline status as SDK-only and shows
deferred package coordinates, private/prerequisite holds and upstream waits in
the existing expandable details, using escaped text and public controls. The
controlled historical producer fixture is visibly separate from live Desktop
qualification; stories remain fixture-only and visual review stays pending.

Fixture-only Operations stories also exercise validated structured attention,
including its compact category, remediation copy and an exact derived retained-
branch link without introducing a fixture command or arbitrary report URL.

LM-OPS-001 normal-size status text MUST retain at least 4.5:1 contrast in light
and dark surfaces, including scoped SDK statuses, without changing functional
accessibility gates or visual baselines.

### Acceptance details

- The production host composes live ports, GitHub outcome labels, settings, PWA controls, profile/avatar and disconnect; login startup is bounded and late activation preserves input; hash navigation retains PR/tab and board filters across reload/back; navigation exposes Inbox, Activity, Pull Requests, Workflows and Approvals, transparent sidebar/resize handle, expandable ellipsized repositories, one collapsed Command View picker, centered logo and collapsed-icon tooltips.
- Four summary tiles stay on one row and reflect active repository, branch-action, query, status and view filters; mobile/desktop disclosure choices persist, a filter-icon toggle starts closed and retains filters with accent when open, summary bottom spacing is larger when closed, repository options have vertical spacing, the breadcrumb truncates before bounded status/time, and status opens a counted timeline with retry and motion-aware indicators.
- Attention prioritizes approval waits, current failures, reviews and blockers before drafts/running work; unavailable data never appears healthy; category chips and Activity counts retain their inset/contrast; long lanes use measured rendering; empty lanes start collapsed across views/filter changes, remain expandable and never inherit the approval anchor; icon-labelled column actions copy visible GitHub URLs in lane order with toast feedback while empty lanes disable them.
- Cached boards retain motion-aware card refresh indicators; selection opens/updates the inspector with summaries, retained details and disabled pending actions; tablet panes remain adjacent, phones compact navigation, and long titles/review summaries wrap within the pane; inspector footer actions retain container-owned inset spacing; refresh/GitHub controls use neutral hover and keyboard focus, sidebar check groups start collapsed per selection; shared panels retain square headers, fixed icon actions, horizontal descriptions and check/job/workflow links; empty checks start collapsed and pending summaries never invent results.

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
- Badge state and accessible descriptions count only current-revision push workflows; scheduled, manual, chained, dynamic and pull-request runs remain available in workflow views without changing default-branch qualification.
- Apply branch-status selection to repository choices, board items, Operations and workspace activity independently of card statuses; empty matches stay empty, explicit repository selections persist, clear resets filters and hash navigation restores branch filters across PR views and reloads without writes.
- The Run workflow repository field uses a searchable Command View with keyboard selection and a selected tick; changing repository resets workflow/ref/input discovery and never dispatches, and pending execution disables selection.
