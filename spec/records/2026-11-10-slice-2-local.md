# Slice 2 local qualification and shared UI follow-up

Slice 1 was approved before this work. Slice 2 authorizes live reads, remembered
credentials, the GitHub profile/avatar and Turso WASM caching; live writes and
Slices 3–5 remain unapproved. This record distinguishes local packed acceptance
from the remaining registry/hosted acceptance gate.

## Delivered locally

- Production app entry and token login, remembered-token restoration, visible
  authenticated name/avatar, settings and explicit profile-menu disconnect.
- Host-owned session/controller lifetime, late-result rejection, cache partition
  switching and complete old-controller/cache retirement on reconnect.
- GET-only GitHub transport with four concurrent requests, pagination, ETags,
  five-minute reuse, actual cached observation times and rate-limit backoff,
  including numeric and HTTP-date Retry-After.
- Current dependency-automation allowlist plus coordinator, additions/exclusions,
  hold reasons and explicit missing-resource/endpoint coverage.
- Open PRs with current-head check runs/statuses/reviews and selected PR bodies;
  latest workflow attempts, current branch/PR-head validation, pending deployment
  waits and lazy jobs for the identified attempt.
- PR-linked workflow details preserve the exact open PR/head target; ambiguous,
  closed or changed associations cannot borrow merge authority.
- Public shared RepositoryForgePanel and RepositoryChecks from the source-owned
  Agent UI change, retaining the reviewed PR body and embedded merge controls.
- All item kinds share borders, disclosure/floating controls and grouped checks;
  PR merge controls remain visible but disabled until eligible, without a
  duplicate inspector-footer button or invented merge target for standalone runs.
- Standalone production-component stories for the toolbar, inbox, inspector,
  navigation/profile, board/activity, filters/picker, checks/PR details, actions,
  confirmation and token/repository settings; complete screens compose them.
- Real Turso OPFS persistence, token-digest partitions, row/total bounds, startup
  timeout, old-record pruning and visible resilient fallback to a session cache.
- Public header-only isolation bootstrap with startup settling before credentials
  can be entered; no offline asset/data caching or deployment was introduced.
- CI includes app build and real browser storage/session acceptance, retaining
  the existing Storybook, type, source-boundary and specification gates.

## Source package evidence

Shared source commit: `e523d787aa3681cdcde294992c60e6bfb19aa945`, in
[Agent UI PR #22](https://github.com/lapismd/agent-ui/pull/22).
Its complete hosted verification is green:
[run 42908964401](https://github.com/lapismd/agent-ui/actions/runs/42908964401).
Source evidence, source comparisons, licenses, native tokens and the minor
changeset are recorded in that repository; no consumer copy/private import,
package patch, alias or node_modules edit conceals a shared defect.

Local Maintenance acceptance uses pnpm to install the normal packed public
archive from `agent-ui-maintenance-checks/.local/packages/`, restoring the
tracked package/lock bytes immediately after installation. The archive SHA-256
is `aa4560cae8ef34e02a0e2212009c93c8299b0ccb5d2b5691d39bf213f784899d`.
The tracked dependency remains a registry semver range. Its new exports are not
published yet, so this is explicitly not frozen-registry qualification.

## Local verification

| Command or surface                                                         | Evidence                                                                                                                                                |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm check`                                                               | Formatting, source/ownership budgets and Svelte/TypeScript: zero errors/warnings                                                                        |
| `pnpm test`                                                                | 34 focused unit cases covering controller, transport, discovery/reads, linked PR authority, session, preferences, fallback, visibility and startup      |
| `pnpm test:storybook`                                                      | 67 cases across 18 files, including all standalone families and full-screen integration, with interaction/a11y checks                                   |
| `pnpm test:browser`                                                        | 2 real Chromium cases: Turso reopen/partition/clear/concurrent writes, and app login/remembered remount/cache reuse/profile-menu disconnect             |
| `pnpm build`                                                               | Production app built for `/lapis-maintenance/`; no bare Turso bundle imports; isolation configuration precedes the public bootstrap                     |
| `pnpm build-storybook`                                                     | Fixture-only static catalog built; no screenshot comparisons or baseline updates                                                                        |
| Production-asset browser smoke                                             | Built `main.es` SDK chunk served under `/lapis-maintenance/` with isolation headers, persisted/reopened/cleared a disposable real database successfully |
| `pnpm exec spec-validator doctor`                                          | 11 checks passed, zero warnings using the installed Node 24 runtime                                                                                     |
| `pnpm spec:search --semantic "shared checks panels and component stories"` | Real QMD search executed; the canonical chapter remains authority                                                                                       |
| `pnpm spec:check`                                                          | Validation, source boundaries, mdBook and mapped spec-first passed                                                                                      |
| `actionlint .github/workflows/check.yml`                                   | CI workflow validated                                                                                                                                   |

The pinned pnpm command runtime reports Node 24.15.0. Spec Validator remains the
latest verified Deno-free registry release, 0.2.0. GitHub's current allowlist was
also read through the connected source, blob
`e2c749a700ca68883e131b2674eda15cac45d005`, confirming the holdReason schema and
19 defaults before adding the coordinator.

## Failures found and corrected

- Original narrow dashboard target: 1 failed/1 passed; the stale footer Merge PR
  assertion now checks the retained embedded Squash and merge control.
- Shared checks integration initially had 2 failures from a single journey
  trying to open a card in a collapsed column and a synthetic hover event not
  changing the native CSS hover state; independent item-kind journeys preserve
  the applicable controls, and the circular icon still has explicit geometry
  assertions and authored rest/hover fills.
- Full catalog: 1 failed/66 passed; the settings trigger overwrote Dialog's open
  handler, now corrected and re-proved with the exact story before all 67 passed.
- Session: 1 failed/4 passed; reconnect did not close the old cache, now corrected
  with serialized ownership retirement and all 5 session cases passing.
- Disconnect data clearing: 1 failed/4 skipped in the exact session target;
  session retirement now calls the explicit disconnect path before disposal to
  clear snapshots, selection and details, so retained references cannot expose
  a previous session's fetched view; the existing generic disposal/late-response
  contract is preserved rather than weakening its original assertion.
- Read coverage: 1 failed/4 passed from expecting permission-denied HTTP requests
  to be cached; cache reuse is asserted over available resources, with denied
  resources separately covered and never retained as successful data.
- Cancellation: 1 failed/4 skipped in the exact target; current cancelled checks
  incorrectly became unavailable, now classified distinctly without treating
  missing results as healthy.
- App browser startup first had 1 suite import failure from late Vite optimization;
  public dependencies are explicit optimizer inputs, without suppressing reload
  diagnostics; the first browser journey then failed at its mobile-hidden profile
  because no desktop viewport was set, and now uses an explicit desktop viewport
  while narrow behavior remains covered by Storybook.
- The official Turso Vite entry failed in its worker pool; the documented public
  bundle entry passed real browser persistence and production-asset acceptance.
- One aggregate run had 1 Navigation import suite failure (Invalid left-hand
  assignment) and 65 executed passes; the exact two-case Navigation rerun passed
  without changing assertions, and browser story files now execute serially like
  the shared package lane to bound compilation/fixture workloads while retaining
  every case and diagnostic in the final cold qualification.
- Formatting/spec-first findings were retained and corrected, including atomic
  acceptance bullets and a distinct shared-component requirement.

## Remaining review and release gates

- Obtain approval to merge/release the source component change through Agent UI's
  existing release process; its AGENTS.md explicitly excludes publication until
  user review, despite source implementation being authorized.
- Update Maintenance to the released registry range/lockfile, repeat frozen
  install and focused consumer acceptance, then commit/push Slice 2 and verify
  its hosted CI before requesting Slice 2 data/connection approval.
- No real GitHub token was obtained or entered by the agent; live account data
  review remains with the user through the local application.
- No live writes, publication credentials, backend/bot, Maintenance deployment,
  PWA installation, offline data rendering or screenshot baseline update occurred.
