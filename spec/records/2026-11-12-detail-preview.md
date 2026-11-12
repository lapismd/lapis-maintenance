# Cached inspector presentation — 2026-11-12

## Observed boundary

The board cache restores item summaries; selected full details have a separate
persistent record. Live read-only inspection found 15 saved detail records in
337 IndexedDB records. Selection cleared the previous detail before awaiting
storage, and inventory restoration replaced in-memory full details with summary
placeholders. This allowed a full inspector skeleton even for an already saved
card. The first-paint fix did not cover this selection boundary.

The inspector now renders the selected card's known title, status and reasons
immediately while local full details load. It does not fabricate checks from
the card summary. The GitHub port retains up to 100 full selected-detail previews
and publishes matching previews synchronously before querying persistent storage.
Previews match selection, immutable target and repository invalidation version,
expire after one day, and clear on permission denial. Persistent freshness still
determines whether GitHub revalidation is necessary. Commands continue to bypass
previews, and UI actions remain disabled until the detail read settles.

Category chips have a quarter-rem top margin in the application's own card
snippet. Shared Kanban component styles are unchanged.

## Regression ledger

- `pnpm exec vitest run --project unit src/github/detail-preview.test.ts`:
  two product failures before the fix (missing synchronous full preview and
  expired preview reuse); all five cases passed afterward. An initial revision
  fixture shared a mutable target with its cache entry; cloning separated the
  two revisions and preserved the target-mismatch assertion.
- `pnpm exec vitest run --project browser src/app/cached-details.browser.test.ts`:
  one failure before the fix (missing immediate heading); the cold browser case
  passes afterward, proving summary before delayed storage, persisted full
  content before blocked network, disabled merge during refresh, and retained
  content after transient HTTP failure. A test query used the obsolete merge
  label; it now asserts the rendered Squash and merge button without increasing
  timeouts or weakening the disabled assertion.
- Two new component stories cover loading saved details and cached revalidation.
  Their interactions passed; type checking caught two unsupported Testing
  Library options, removed while retaining exact string names.

## Wide Brave investigation

The user additionally reported disappearing board content after scrolling and
selecting in Activity, specifically in a wide fullscreen Brave window. Native
inspection confirmed missing board paint while inspector content remained.
A 1800-pixel, 100-card Chromium reproduction preserved bounded scroll geometry
and headers; it does not establish that Brave's fullscreen paint defect is fixed.
No speculative shared-package or browser-security change is included.

## Qualification

- All 88 unit tests and 15 browser cases passed, including cold persistent-cache
  inspector coverage and the wide-board geometry check.
- All 93 Storybook interaction/accessibility cases and seven PWA cases passed.
- Formatting, source boundaries, types, application/static Storybook builds and
  all four specification lanes passed. The specification audit caught acceptance
  count and sentence-shape errors; the canonical bullets were corrected without
  changing validator rules. Latest published spec-validator remains 0.2.0; doctor
  passed nine checks with two QMD availability warnings and documented rg fallback.

Hosted CI and live acceptance follow the checked source.
Changed stories remain visual-pending; no screenshot baseline is compared or
updated.
