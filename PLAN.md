# Lapis Maintenance: a dashboard delivered in reviewed slices

## Summary and authorization

Create public `lapismd/lapis-maintenance` for a static Svelte 5 and TypeScript
dashboard built with Design Core's AppShell. The completed application asks for
a GitHub token and uses it directly for repository reads, PR actions, workflow
operations and release approvals. Its final host is GitHub Pages, as a PWA.

Commit this complete plan and the canonical specifications before UI code.
**Slice 1 is only the Storybook UI, production controller and in-memory ports.**
Stop for user approval after every slice. Approval of one slice does not
authorize the next. The user authorized foundation and Slice 1 on 2026-11-10;
Slice 1 was approved and Slice 2 authorized on 2026-11-10. The subsequent request
for write access in the live story explicitly authorizes Slice 3 implementation.
The user also authorized dependency publication, pushing and Pages hosting;
The user authorized Slice 5 PWA implementation on 2026-11-11.
The 2026-11-14 continuation authorizes Slice 4, including manual dispatch.
Slice 2 remembers a token on this device,
shows token login without a valid session, and uses Turso WASM to cache reads.

### Continuation authorized 2026-11-14

The user approved the reviewed UI and requested the remaining real implementation,
push and merge when green. This supersedes the R2–R4 separate approval stops:
workflow/environment action fixes, faster reads and the live PR/activity workspace
are authorized together. Keep components local, preserve all data/credential and
write-preflight boundaries, then validate, push a PR, merge its exact green head
and verify Pages/PWA deployment. The user explicitly included all remaining items and manual workflow dispatch.

## Repository and specification foundation

- Create the public repository and local sibling checkout using Jujutsu.
- Add tracked agent guidance, development instructions and this complete plan.
- Install the latest published Deno-free `@lapismd/spec-validator` (0.2.0 at
  initial setup) and initialize its heading-based canonical specification.
- Specify dashboard behavior, controller/port boundaries, token lifetime,
  GitHub reads, writes, hosting and offline behavior. Give requirements unique
  IDs, atomic acceptance criteria and one verification row each. Mark future
  behavior planned and evidence pending.
- Wire `spec:search`, `spec:first`, `spec:check`, validation/build scripts and
  doctor. Exercise QMD-backed search or its documented executed fallback.
- Pin tools and CI Actions; wire formatting, types, focused tests and CI.
  Consume registry semver dependencies and portable registry lockfiles.
- Use Design Core `^0.12.3` and public component guidance before composition.

This foundation documents the whole intended product without live GitHub code.

## UI and controller contract

The default screen is an action inbox across repositories. Use public Design
Core AppShell with left navigation, main inbox and optional right details panel.
Use Design Core Kanban for the inbox and Agent UI repository components for PR
details. Kanban lanes represent observed status; moving cards cannot mutate
GitHub state. Retain its responsive layout, scrolling, toggles and keyboard behavior. Provide
Inbox, Activity, Pull Requests, Workflows and Approvals views over the same data.
Use public Kanban Activity for records grouped by latest update. Keep search,
the Command View repository/status multi-selects, counts, freshness and
icon-only refresh in fixed chrome. Join the inspector to Main, place its GitHub
icon in the header, and keep confirmed actions in a compact fixed footer.

Show repository, title, automation category, current status, age, reasons for
attention, actions and GitHub link. Prioritize approval waits, current failures,
review requests and blockers. Distinguish drafts, running work, holds, cancelled
runs and unavailable data. Details show checks, reviews, workflow information,
approval requirements and feedback. Use public controls, native CSS/tokens,
light/dark and narrow-screen presentations.

- `MaintenanceController` owns selection, filtering, refresh, attention
  classification and action presentation.
- `MaintenanceReadPort` supplies snapshots and selected-item details.
- `MaintenanceCommandPort` executes typed commands against a PR revision,
  workflow attempt or deployment identity.
- Results distinguish completed, accepted/running, rejected and uncertain.
- The host owns adapter construction, credentials and controller disposal.
  Credentials never enter snapshots, Storybook args or persisted preferences.
- Stories inject disposable in-memory ports; later slices replace ports while
  retaining the reviewed controller and screen.
- Mounting, selection, filtering and refresh never issue writes.

## Delivery slices

| Slice                | Deliverable                                                                   | Review boundary                       |
| -------------------- | ----------------------------------------------------------------------------- | ------------------------------------- |
| 1 — Storybook UI     | Complete screen, production controller, fixture ports, simulated reads/writes | UI and interaction approval           |
| 2 — Live reads       | Token session and live GitHub reads                                           | Data coverage and connection approval |
| 3 — PR and CI writes | Reviews, merges, draft readiness, reruns and cancellation                     | Action behavior approval              |
| 4 — Release actions  | Deployment approvals/rejections and manual dispatch                           | Release-flow approval                 |
| 5 — Pages and PWA    | Static deployment, installation and offline shell                             | Final review                          |

### Slice 1: Storybook only

Build realistic fixtures for dependency updates, compatibility drafts, version
PRs, registry publication, failed builds, protected release approvals and holds.
Simulate connection, permissions, confirmations, success, failure, stale targets
and uncertain outcomes. Include populated, loading, refreshing, empty,
disconnected, partial-access and rate-limited states.

All data and effects remain in memory. No live GitHub adapter, real token,
backend, bot, deployment or PWA belongs in Slice 1. Complete focused controller
and browser interactions, accessibility, types, static build and spec checks.
Commit evidence, present the Storybook review URL, and stop for approval.

### Slice 2: token connection and live reads

- Accept one token and identify its GitHub user and avatar. Remember the token
  on this device separately from cached data. Show token login without a valid
  session. Disconnect clears credentials, cached/fetched data and pending reads.
- Read defaults from dependency-automation's current allowlist, include the
  coordinator, and allow explicit additions/exclusions.
- Fetch open PRs, current-head checks/statuses/reviews, runs and environment
  approval waits. Associate failures with current heads/latest attempts.
  Preserve holds and explicitly show incomplete coverage.
- Refresh manually and every five minutes while visible, with bounded
  concurrency, pagination, conditional requests and rate-limit backoff.
- Use token-partitioned Turso WASM/OPFS response caching with five-minute
  freshness, ETag revalidation, bounded retention and visible freshness/cache
  status. Online remembered sessions may display a token-bound read-only preview
  while authentication runs; authenticate before live reads or enabling actions.
  Offline startup stays on the reconnect shell. Disconnect clears the partition.
  If Turso cannot start, use bounded token-partitioned IndexedDB persistence;
  fall back visibly to memory only when neither persistent store is available.
- Bundle a same-origin isolation bootstrap for WASM compatibility on GitHub
  Pages. Its replacement in Slice 5 caches only public app assets. Build
  and exercise the static application now; publishing remains Slice 5.
- Use browser REST plus narrow GraphQL operations where needed. Reject stale
  responses after refresh, reconnect or disposal.
- Fine-grained tokens belong to one owner. Inaccessible repositories remain
  unavailable. Changing tokens switches the session.

Stop for data coverage and connection review before writes.

### Slice 3: PR and CI writes

Support marking drafts ready, submitting approval/change-request/comment
reviews, merging eligible PRs with repository-allowed methods, approving waiting
workflow runs, rerunning failed jobs, and cancelling running workflows.
PR approval requires available current-revision checks. Show the exact target and effect before
confirmation. Re-read immediately before writes and bind reviews/merges to the
displayed SHA. Required reviews, merge queues and repository rules remain
authoritative. Prevent duplicate submissions, refresh after effects, and retain
uncertain results without replaying writes. Stop for action review.

### Slice 4: release actions

Approve/reject pending environments only when GitHub says the user can do so.
Discover existing `workflow_dispatch` workflows and render their declared
inputs, requiring an explicit branch/tag and review of the operation. Link to
the resulting run and distinguish submission from successful publication.
Signing/publication credentials remain in owning workflows. Stop for review.

### Slice 5: GitHub Pages and PWA

Publish the app at `/lapis-maintenance/` and fixture-only Storybook under
`/lapis-maintenance/storybook/`. The local development catalog additionally has
a user-authorized manual live-session story for token acceptance; it is excluded
from static builds and automated story runs. Use hash navigation and base-aware assets,
manifest and service-worker scope. The offline worker caches versioned app assets
only, excluding credentials, authenticated responses, repository data and
Storybook from CacheStorage; the authorized token record and token-partitioned
Turso response cache remain separate device storage. Offline mode opens the
shell with a reconnect message without restoring account data or sending GitHub
requests. Use one worker for isolation and precaching, migrate the old isolation
worker, and offer explicit reload for waiting updates so forms and writes are
not interrupted. Complete production acceptance.

## Verification and acceptance

- Foundation: doctor, search, validation, formatting and CI wiring.
- Slice 1: focused controller cases and Storybook journeys for filters,
  selection, confirmation, failure and retry; keyboard/accessibility, type,
  static Storybook and specification checks. No screenshot comparisons or baseline updates.
- Slice 2: pagination, partial permissions, rate limits, stale responses,
  reconnect/disposal and revision classification.
- Slices 3–4: denied permissions, changed targets, duplicate clicks, uncertain
  responses, blocked merges, changed waits and dispatch input validation.
  Use mocked transport then designated disposable acceptance targets.
- Slice 5: Pages paths, reload, install and offline, with credentials confined to
  the explicitly remembered session record, API bodies confined to the authorized
  repository-data cache, and neither present in service-worker CacheStorage.
- Record commands, counts, failures and gaps in canonical verification/evidence.
  Commit every verified slice with Jujutsu and stop for its review.

The initial release uses one token, individual actions and existing GitHub
automation policies. Bulk operations, monitoring while closed and a separate
hosted service remain deferred.

## Sources

- [Browser API requests](https://docs.github.com/en/rest/using-the-rest-api/using-cors-and-jsonp-to-make-cross-origin-requests)
- [Token limitations](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
- [Merge expected SHA](https://docs.github.com/en/rest/pulls/pulls#merge-a-pull-request)
- [Deployment review](https://docs.github.com/en/rest/actions/workflow-runs#review-pending-deployments-for-a-workflow-run)
- [Manual workflow dispatch](https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event)

## Slices 2 and 3 qualification

Local implementation and packed-consumer qualification are recorded in
`spec/records/2026-11-10-slice-2-local.md`; that earlier checkpoint is historical.
Shared source PR #22 and version PR #23 are merged and checked on main. The
immutable v0.2.2 cohort published Agent UI 0.2.2 and Repository UI 0.2.0; exact
registry bytes, clean installs and provenance passed. Maintenance now uses the
released ^0.2.0 range and frozen registry lock. All local unit, browser,
interaction/accessibility, type and static-build gates pass. Disposable PR/CI
writes and real reviewed-candidate PR/workflow approvals also passed.
Evidence: `spec/records/2026-11-11-release.md` and its linked checkpoints.
Maintenance hosted CI and Pages delivery are verified, including public login,
reload, isolation, fixture filters and deployed-asset byte equality. Slices 2/3
and hosting are ready for user review; release actions remain unapproved.

## PWA qualification

The installable Pages app, README badges and installation guidance are delivered.
The final registry-backed candidate passes all local gates and hosted CI; the
deployed app passes byte-identity, isolation, installation, offline reload,
reconnect and cache-boundary acceptance. Evidence and the dependency release
receipt are in `spec/records/2026-11-11-pwa.md`. Slice 5 is ready for user review;
Slice 4 remains unapproved.

## Cached reload follow-up

Restore assembled cards before discovery, retain them during background refresh
and mark repository/card revalidation independently. Checkpoint partial scans so
reload can reuse completed work. Turso remains preferred, with a persistent
browser-storage fallback when isolation is unavailable. Qualify the shared UI
runtime floor upstream to keep long checks separate from merge controls, then
consume the npm release. See `spec/records/2026-11-11-cached-reload.md` for the
failure ledger and qualification; Slice 4 remains unapproved.

## GitHub and PR follow-up — revised 2026-11-14

The user revised the T3-inspired plan: **the first deliverable is UI in
Storybook only, and new components stay in this repository for now**. This
supersedes the proposed action-fixes-first sequence; the continuation authorization
above now permits implementing the remaining live follow-up slices.

### Intended product and findings

Retain Svelte, Design Core AppShell, Repository UI primitives, direct browser
GitHub requests, remembered token sessions and token-partitioned Turso caches.
T3 Code supplies patterns for batched GraphQL summaries, independent resources,
conditional refresh, 150ms intent prefetch and exact fork/head approval checks.
Preserve provenance and MIT attribution for later code adaptations.

Maintenance already has persistent caches, ETags and interactive priority, but
inventory reads checks/statuses/reviews separately per PR. Approval checks only
conclusion, environment actions are intentionally gated, check/job URLs are
discarded, and controller plus adapter duplicate preflight reads. Existing
focused tests pass 30/30. Live fixes have not been implemented in this follow-up.

### Revised delivery slices

| Slice                       | Deliverable                                                                                            | Review boundary                           |
| --------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| R1 — Local Storybook UI     | Production components/controller, disposable fixture ports, complete PR workspace and approval/link UI | UI approved; implemented                  |
| R2 — Live actions and links | Repair workflow approval, environment review, URLs and eligibility/errors                              | Implemented; qualification recorded below |
| R3 — Faster reads           | Batched summaries, independent resources, scoped caching, prefetch and one authoritative preflight     | Implemented; qualification recorded below |
| R4 — Live PR workspace      | Activity adapters, resource caching, routes and hosted acceptance                                      | Implemented; qualification recorded below |

### R1: complete fixture-only UI

- Keep quick details in the joined inspector; Open PR view enters main-panel
  Overview, Checks and Activity tabs, plus a Files on GitHub link. Back retains filters/selection.
  Preserve shell navigation, theme/profile, Kanban, resizing and responsiveness;
  a circular icon-only Back preserves board context, while All repositories
  and repository breadcrumbs open the inbox with the corresponding filter.
- Overview shows author, branches/revision, description, labels and review/merge
  state. Checks have grouped collapsible linked rows, refresh and merge controls.
  Merge permission is independent of review approval; GitHub enforces repository
  rules when a confirmed merge is submitted. PR approval still requires checks.
  Activity is a paginated timeline. File browsing and diffs open on GitHub;
  no local file resources, patch cache or file-review UI are required.
- A repo-owned controller owns tabs, independent resource states,
  refresh, confirmation and feedback. Hosts own read/command ports and disposal;
  stories own invented data and simulate latency, pagination and effects.
- Distinguish fork workflow approval from environment approve/reject. Show exact
  repository/run/attempt/revision/environment and concrete permission/reviewer,
  timer, stale-target and uncertain-result feedback. Confirmations identify the
  effect and submissions are explicitly simulated. No real token, network,
  persistence, write, app route, live-shell integration or backend is added.
- Workflow/check titles and result links open their identified targets in a new
  tab. Card bodies still open details; action buttons retain confirmation.
  Render the same local components in complete-screen and standalone stories.
- Cover loading, retained refresh, empty/error, denied, pending approval,
  accepted/stale/uncertain, light/dark and narrow states. Keep registry
  dependencies unchanged and make no sibling or upstream API changes.

### R1 extension: main Activity timeline

The main Activity navigation item previews a Community-style timeline rather
than a Kanban board. A shared local entry component serves PR and workspace
activity. A compact header places multi-event types beside a search toggle.
Search and multi-repository/status filters start hidden on all toolbar views;
the filter-icon toggle uses accent styling while open and hidden filters retain values.
Event types show leading icons and trailing ticks for multiple selections.
Repository icon buttons and sidebar repository selection open the inbox with just
that repository selected, closing the PR workspace. Status uses colored icon
chips, details use an eye icon, and explicit success/failure events have subtle
tints while neutral events stay unboxed. The current date is sticky and changes
with the visible timeline day. Typed cursor-page reads belong to a disposable fixture
port; a local controller owns query identity, page state, duplicate prevention,
stale-response guards and retained refresh/retry data.

Use measured virtual rows with bounded overscan and near-edge page loading,
with an explicit Load older fallback, accessible loaded/total counts, stable
keys and preserved scroll on return. Add populated, empty, loading, refresh,
error/retry, long-feed, dark and narrow stories, and controller/scroll/filter
regressions. Add spacing between repository-picker options. Components remain
in this repository, with no live transport, persistence or deployment; live
workspace activity reads join R4 only after UI approval.

### R2: live actions and links after approval

Recognize action-required status/conclusion, public-fork identity, unambiguous
current PR/head and run attempt. Revalidate immediately before approval.
Environment review uses current pending-deployment/actor eligibility and exact
run/attempt/environment confirmation. Explain Actions versus Deployments write,
unverified access versus confirmed denial, unrelated resource failures and
bounded GitHub rejection details. Preserve target links, individual confirmed
commands, duplicate prevention and uncertain outcomes without replay. PR approval
still requires reported checks; merge rules remain authoritative. Manual dispatch follows the original Slice 4 contract. The reviewed components remain local until separately requested.

### R3: faster reads after approval

Measure cold/warm requests and selected-detail/action timing. Read lightweight
PR summaries in read-only GraphQL batches of at most 25 through the four-slot
limiter, with per-PR partial errors and scoped REST fallback. Load full checks
and reviews for selection or validation; load optional resources independently.
Track/drain asynchronous persistence without delaying verified reads or allowing
invalidated data back. Keep five-minute inventory refresh; selected pending
checks may refresh at 45 seconds while visible. Prefetch one hovered/focused
card after 150ms; pass-over does no work, and cancellation cannot harm another
subscriber. Retain cache bounds, token and offline boundaries. Put one fresh,
action-specific preflight in the command adapter immediately before writing;
remove duplicate validation only with complete safety regression evidence.

### R4: live PR resources after approval

Connect the reviewed screen and workspace timeline to paginated conversation/review activity using their reviewed read ports. Load
activity lazily and cache it separately, preserving cached boards. Add PR
identity/tab hash routes with Back restoring the board. Files and diffs remain
on GitHub through a direct changed-files link; do not add file APIs, patch
caching or an embedded file viewer. Inline review drafts/comments and bulk PR reviews remain deferred; S4 authorizes limited confirmed workflow/environment batches under LM-ACT-003; the original
Slice 4 manual dispatch is now authorized as part of this continuation.

### Verification and review gates

Commit this revised plan and canonical foundation before UI code. For R1 run
focused controller/Storybook journeys, component and shell accessibility, types,
architecture, repository tests, app/static Storybook builds and specifications.
Inspect populated light/dark/narrow screens in a cold Storybook process. Leave
stories visual-pending without screenshot comparisons or baseline updates.
Commit the verified UI and stop for review; do not push to auto-deploying main.

Later slices add mocked permission/stale/uncertain-write cases, pagination,
partial-data/session/disposal tests and designated disposable live targets.
Performance acceptance requires zero requests for a fresh reopen and at least
50% fewer cold requests in a controlled 20-PR fixture. Qualify hosted CI/assets
and PWA boundaries when live integration/deployment is separately approved.

## 2026-11-14 live implementation checkpoint

All remaining authorized implementation is complete locally, including manual
dispatch. R2/R3 commits and the live workspace receipt document the regression
ledger and local gates. Exact-head CI, merged-main Pages delivery and designated
real environment/dispatch acceptance complete this continuation before handoff.

## 2026-11-14 release qualification

PR #2 merged its checked head and passed merged-main CI/Pages. Real dispatch,
environment approve/reject, rerun/new-attempt approval and hosted PWA/cache
boundaries are qualified in `spec/records/2026-11-14-release.md`. The small
workflow Actions-link follow-up and this receipt use the same CI/Pages gate;
all remaining authorized implementation, including manual dispatch, is delivered.

## 2026-11-15 coordinator operator integration

The authorized consolidated dependency-automation S4 adds a version 1 read-only
coordinator adapter, open issues, wave/decision attention and individually
confirmed batches of eligible reruns/workflow/environment approvals. The browser
reads the coordinator's durable public report branch; unattended collection
remains in coordinator Actions. Unsupported/missing/stale reports preserve
ordinary manual controls. Batch execution uses the existing immediate preflight
and retains partial/uncertain outcomes without replay. Source implementation
and fixture acceptance precede hosted Pages/PWA and designated disposable action
qualification. No private report data enters public app/Storybook assets.

Local S4 qualification passes 201 unit tests, 19 browser tests, 183 Storybook
interaction/accessibility scenarios, seven PWA tests, type/boundary checks,
production/static builds and canonical specification lanes; the regression
ledger is `spec/records/2026-11-15-operator.md` and hosted Pages/disposable batch
qualification remains pending.

## 2026-11-15 — One-click action policy amendment

The approved confirmation audit supersedes earlier blanket confirmation steps
in this plan. All current actions, including merge, release/environment approval,
auto-merge toggles and eligible batches, execute on explicit action activation.
Only permanent content deletion requires confirmation; no current command
deletes content permanently. Comments/change requests and manual dispatch retain
required-input forms with one submit action. Optional approval comments never
block execution. Preserve immutable targets, fresh preflight, synchronous busy
guards, per-target batch receipts, disposal and uncertain-result no-replay.
Apply this to live and older fixture components; qualify full local checks,
CI and Pages. Include the reported collapsed check-group boundary border fix.

## 2026-11-16 — Repository Actions and Operations refinement

The user approved all remaining UI work, required shared-package publication,
push/merge and deployment without another review stop. Cached default-branch
Actions badges and multi-select filters cover repositories and views; dispatch
uses the shared searchable Command View. Operations retains its existing page
with a compact collapsible timeline, sticky headers, ScrollArea, fixed action
footer and shared joined identifier pairs with custom labels.

Local public-archive qualification passes 225 unit, 20 browser, seven PWA and
210 Storybook cases plus type, boundary, spec and static builds. Source PRs #38
and #39 merged green; immutable release `v0.2.8` passed registry byte/provenance
verification. The temporary archive is replaced by Repository UI `^0.2.6` and
Design Core `^0.13.4` registry floors. Final registry consumer validation passes
the same full matrix, with 27 focused stories and a cold populated shell review.
Exact-head hosted CI and merged-main Pages/PWA remain separate delivery gates.
Evidence: `spec/records/2026-11-15-repository-actions-operations.md`.
