# Responsive details and compact status header — 2026-11-11

Authorized improvements: immediate cached/stale detail display, interactive read
priority, affected-repository refresh after commands, and a compact breadcrumb
with visible status and time-only freshness. Writes retain fresh target checks.
Slice 4 release actions remain unapproved. No real GitHub writes were used here.

## Diagnosis and behavior

- Earlier read-only browser diagnosis measured about 4.2 seconds for revalidated
  details, including a roughly 2.7-second GitHub checks/status batch. Warm cached
  reopens took 26–38 ms without API requests. These are baseline observations,
  not claims of new live-network timings.
- The four-slot FIFO queue also delayed interactive work behind inventory reads.
  Commands previously forced a full scan of every selected repository.
- Revision-matching persisted details now return directly within five minutes,
  and stale details up to a day old appear while revalidation runs. Transient
  failure retains the preview and offers retry; denied access clears it. Actions
  stay disabled during incomplete refresh and command validation bypasses cache.
- Selected reads and shared queued reads take priority over background inventory,
  without increasing concurrency. Aborted promoted reads release their slots.
- Command completion refreshes only its repository, invalidates affected derived
  details/entities and preserves unrelated records and full-view freshness. A
  newer scoped result wins over an older global scan; pre-command HTTP responses
  cannot overwrite the new repository cache.
- The breadcrumb yields space to the counted status trigger. Mobile and narrowed
  desktop stories verify its usable width and popover. Freshness shows `HH:mm UTC`
  with snapshot context available through its title.

## Failure ledger

- Exact baseline command: `pnpm exec vitest run --project unit src/github/transport.test.ts src/github/read-port.test.ts src/maintenance/controller.test.ts -t 'promotes selected|publishes stale details|refreshes only the affected'`.
  Before implementation: 3 failures, 23 skipped. After: 3 passed, 23 skipped.
- Added race test initially had 1 failure from expecting an unsorted snapshot's
  display order; corrected its fixture expectation to the patch contract.
- New Storybook cases: 4 failures, then 1, then 1, then 0. The cases needed search
  before opening virtualized cards, animation settling before visibility checks,
  and a desktop width that kept the main header accessible. Product assertions
  retain checks, disabled actions, retry, header geometry and popover coverage.
- Check setup: 1 formatting failure and 2 test fixture type errors, then zero
  formatting/type/architecture failures. No assertions or baselines were relaxed.

## Verification

- Specification doctor: 11 passed, 0 warnings. QMD semantic search for cached
  revalidation, interactive priority and repository refresh completed.
- Focused controller, transport, read/cache and race tests passed. The deferred
  response tests prove previews appear before the network gate opens, shared
  reads are promoted without duplication and fresh validation emits no preview.
- Real Turso browser persistence/isolation/clear tests additionally verify prefix
  deletion retains neighboring repository keys.
- Full local lanes passed: `pnpm check` (formatting, architecture and zero Svelte
  errors/warnings), `pnpm test` (75 tests), `pnpm test:browser` (5),
  `pnpm test:storybook` (86 interaction/accessibility cases), `pnpm build`,
  `pnpm test:pwa` (7), `pnpm build-storybook` and `pnpm spec:check` (4 lanes).
- Cold static Storybook browser acceptance displayed checks during a deliberately
  deferred refresh with disabled approval/merge controls. At 390 px, the header
  measured 340 px, breadcrumb 64 px and status trigger 228 px; freshness was
  time-only. No GitHub requests or page errors occurred. Build output retained
  the existing non-blocking large-chunk notices.
- Hosted CI and Pages verification follow the qualified commit; the deployment
  outcome is reported with completion rather than inferred from local checks.
- Changed stories remain visual-pending; no screenshot comparisons or baseline
  updates were performed.
