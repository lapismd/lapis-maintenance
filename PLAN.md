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
Slice 4 release actions remain planned and unapproved.
Slice 2 remembers a token on this device,
shows token login without a valid session, and uses Turso WASM to cache reads.

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
  status. Authenticate before cache reuse; disconnect clears the partition.
  Storage failure falls back visibly to a memory cache.
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
  Turso cache, and neither present in service-worker CacheStorage.
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
