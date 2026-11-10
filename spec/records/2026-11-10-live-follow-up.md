# Live session, cache and PR/CI write qualification

This follows the historical Slice 2 checkpoint without changing its evidence.
The user authorized remembered tokens, Slice 3 PR/CI writes, publishing required
dependencies, pushing and GitHub Pages hosting. Deployment-environment review,
manual workflow dispatch and PWA installation/offline acceptance remain future
gates. No screenshot baseline was updated.

## Delivered behavior

- The production app and local-only live Storybook story share token login,
  authenticated GitHub avatar/name and a clear profile-menu disconnect.
  Credentials live in the explicit device-local session record and active
  transports; never controller snapshots, Storybook args or the Turso data cache.
- GET-only reads are separate from uncached non-retrying commands. Both use a
  bound native browser fetch receiver. Reload authenticates `/user` before
  exposing the token-partitioned cache. Disconnect retires the controller,
  drains transport/cache work and clears the remembered session and active data.
- Turso WASM's official bundle persists in OPFS. It stores API bodies, ETags,
  pagination/freshness metadata, assembled dashboard views and selected card
  details. Fresh five-minute views/details reopen without API reconstruction;
  manual refresh and command preflight force revalidation. The actual oldest
  observation time remains visible. Unsupported persistence has explicit fallback.
- Storage is bounded to 1 MiB per row, 25 MiB total and 1,000 rows, pruning records
  after 24 hours. Active inventory covers default-branch/open-PR heads and pending
  workflow approvals, with bounded concurrency, pagination and rate backoff.
  Old closed-PR branches no longer consume generic history/ref scans.
- Confirmed writes support draft readiness, PR approval/change-request/comment,
  allowed-method merges, failed-job reruns, cancellation and workflow-run approval.
  Reviews/merges bind the displayed SHA. Other APIs are revalidated immediately
  before submission because GitHub lacks atomic SHA/attempt preconditions there.
  PR approval requires available current-revision checks; self-approval rejects.
  Merge requires complete passing checks, no hold and GitHub's clean eligibility.
- Commands prevent duplicate requests, re-read capabilities, refresh affected
  data and distinguish completed, accepted, rejected and uncertain outcomes.
  A 30-second write timeout is uncertain and cannot automatically replay.
  Approving a workflow means CI was submitted, not that CI passed.
- Shared production components and standalone stories cover all views: bounded
  grouped checks, embedded PR merge controls, collapsed missing checks, horizontal
  PR Markdown, theme-aware floating panels and compact fixed inspector actions.
- Repository and status filters both support multiple Command View selections.
  Settings show allowlist checkboxes and explicit additions/exclusions; long repo
  names truncate. Collapsed navigation has one repository picker and tooltips.
- Coverage/hold/action feedback uses a bounded centered header control with count
  and icon timeline; loading animates with reduced-motion support. Main/details
  refresh controls are icon-only. Clicking an already selected card reopens the
  inspector and retains cached details while an explicit refresh is pending.
- Pinned Pages Actions publish only checked main output, combining the app and
  fixture-only Storybook. The live story is excluded from static and automated
  story discovery. The isolation worker supplies headers without response caching.

## Verification at the local checkpoint

Commands use Node 24.15.0 and pnpm 10.34.5. Spec Validator 0.2.0 is the latest
published Deno-free release verified with the npm registry.

| Command                                                                                         | Result                                                                   |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `pnpm check`                                                                                    | Formatting, source boundaries/budgets and types: zero errors or warnings |
| `pnpm test`                                                                                     | 61 unit tests, 12 files passed                                           |
| `pnpm test:storybook`                                                                           | 76 interaction/accessibility cases, 22 files passed                      |
| `pnpm test:browser`                                                                             | 5 real Chromium cases, 4 files passed                                    |
| `pnpm build`                                                                                    | Production app/subpath build passed                                      |
| `pnpm build-storybook`                                                                          | Fixture-only static catalog build passed                                 |
| `actionlint .github/workflows/check.yml`                                                        | Passed                                                                   |
| `pnpm spec:search --semantic "Pages hosting cache and multi-select status filter verification"` | QMD search returned the owning canonical requirements                    |

Browser cases prove real Turso reopen/partition/clear/concurrent writes; login,
remembered remount, cache reuse and disconnect; production confirmed SHA-bound
merge through mocked GitHub; and native browser fetch for both transports.
Mocks do not establish disposable real-GitHub write acceptance.

Local reports: `.local/complete-unit-latest.log`, `complete-storybook.log`,
`complete-browser.log`, `complete-quality.log`, `complete-build.log`,
`complete-static.log` and `pages-actionlint.log` in this checkout.

## Retained failures and corrections

- Native browser fetch: one failure before binding; read/write browser cases pass.
- Local live-story discovery: three failures before exclusion configuration;
  the exact discovery cases then pass without exposing credential args.
- Duplicate coordinator coverage on allowlist failure: one failed/five passed;
  coverage now merges by repository.
- Obsolete workflow refs: one failed/six skipped before current-head inventory
  and association fixes. A separate inventory regression failed before removing
  the broad historical scan and now passes. The earlier scan exhausted the real
  account's 5,000/hour REST quota; requests now target active revisions only.
- Header accessible-label mismatch: 16 failed/eight passed before correction;
  no axe assertion was suppressed.
- Unsupported icon import: two suite failures, replaced with the public Pause icon.
- Popover fade timing: one failed/26 passed, fixed with waitFor on actual dismissal.
- Lazy ScrollArea optimization caused two settings failures and an iframe startup
  timeout; explicit optimizer inputs and a cold restart fix startup.
- Unsupported test exact option: four type errors, replaced by anchored regexes.
- Inspector reopen story used desktop-only button names and asserted before async
  details; it now supports actual public responsive controls and waits for details.
- Full catalog: one failed/75 passed because the mock merge kept the PR open.
  The fixture now removes it and the journey additionally requires completion,
  zero filtered items and no merge control. Exact case and all 76 then pass.

## Shared package and remaining gates

Source is [Agent UI PR #22](https://github.com/lapismd/agent-ui/pull/22), including
the overflow/disclosure follow-up at `d2678786031ddcbbaab0e4061b9127632032af11`.
Local qualification uses a public packed Repository UI 0.1.3 archive with SHA-256
`8bc21bf45aa6e9e9b9378e48f1a86c46dff0cd010cda9ce1902ffb49f0613230`.
Tracked manifests/lockfiles retain registry ranges. No dependency patch, alias,
private import, copied shared implementation or node_modules edit is involved.

This checkpoint is not registry-qualified. Required remaining work is updated
source hosted qualification, published dependency intake and frozen install,
consumer hosted checks and Pages/browser acceptance. Real disposable PR/workflow
acceptance subsequently passed as recorded in
`spec/records/2026-11-10-disposable-writes.md`.
Pages is enabled at <https://lapismd.github.io/lapis-maintenance/> but has not
yet deployed at this checkpoint. The agent has neither entered nor extracted a
real browser token. User manual live review is distinct from automated acceptance.
