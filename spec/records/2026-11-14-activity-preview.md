# Activity timeline UI review — 2026-11-14

Foundation commit `809edab6` recorded LM-FEED-001 and the complete R1 extension
before the implementation. This slice is local UI preview work; R2–R4 live
GitHub behavior remains planned and requires separate approval.

## Implemented scope

- ReviewShell's Activity navigation uses a Community-style timeline with one
  shared ActivityEntry for workspace and PR activity. Repository-owned components
  retain Apache-2.0 attribution for the adapted Community virtual rows.
- An injected fixture read port supplies 40-event cursor pages from 240 events.
  ActivityController normalizes query identity, filters before paging, prevents
  duplicate page requests, deduplicates IDs, rejects late/cancelled/disposed
  responses and preserves matching rows and scroll through navigation.
- Measured virtual rows use the actual ScrollArea viewport, bounded overscan,
  a measured header offset and near-edge reads. The pinned current-date heading
  follows the first visible event day. Refresh and pagination errors retain
  useful rows, with explicit retry and Load older fallbacks.
- Header event filters support multiple selections, left event icons and right
  ticks. Shared toolbar search/repository/status controls start hidden; an
  accent-when-enabled filter icon reveals them without clearing their state.
  Summary spacing is larger when those filters are hidden and compact when open.
- Repository icon buttons and preview sidebar repository selection return to
  the inbox with just that repository selected. Activity details use an eye
  icon; status chips have icons and theme colors. Explicit event success/failure
  uses subtle background tints and text/icon labels; neutral information stays
  unboxed, independent of the linked item's current status.
- Empty Kanban lanes are unlocked and collapsed by default across views/filter changes, with an explicit nonempty anchor and retained user expansion within a view; the regression failed once before the fix and passes afterward.
- The original description-header spacing is retained and the metadata header matches its height, approval counts align right with accent fill, tabs have visible bordered hover states, and textual actions use suitable shared icons.
- PR headings have smaller vertical padding and Open PR view has a leading
  expand icon. Preview merge permission is separate from review permission and
  approval counts. Confirmation can yield a simulated repository-rule rejection;
  PR approval still requires checks. Live adapters and action policy are untouched.

## Verification

- Registry check: spec-validator latest is `0.2.0`, already used through a normal
  semver range. Doctor: 11 passed, no warnings; a QMD semantic spec search ran.
  Frozen registry install passed with the direct TanStack Svelte virtualizer range.
- Focused activity/review controller tests: 17 passed. Full unit lane: 105 passed.
- Focused activity, review, component, merge and navigation stories: 40 passed;
  shared toolbar/filter/inbox families: 55 passed. Full Storybook interaction and
  accessibility lane: 167 passed across 39 files.
- `pnpm check`: formatting, source boundaries, file budgets and Svelte/TypeScript
  passed with zero errors/warnings. Browser lane: 16 passed across 9 files.
- App and fixture-only static Storybook builds passed. PWA acceptance: 7 passed,
  including offline account isolation, cache contents, update/form preservation,
  worker migration, hash navigation and bounded startup.
- Cold Storybook process at port 7514 was restarted after optimizer configuration
  changes. Manual light/dark browser review confirmed the eye/filter controls,
  chips and tints. Scrolling loaded 80 events while mounting 17 rows; the pinned
  date changed to 13 November with exactly matching date/viewport top coordinates.
  A local screenshot is retained at `.local/activity-reviewed.png`.
- `pnpm spec:check` passes canonical validation, specification-first mapping,
  Markdown, source-boundary and book-build lanes.

The final targeted PR/board/filter lane passed 24 stories after the empty-column
and hover refinements; all 40 directly affected PR/board/approval stories also
passed. Metadata and description headers both measured 46.46875px, and both
GitHub icons showed a neutral `rgb(246, 246, 246)` hover fill with no pointer
outline, while keyboard focus styling remains defined. The final PR screenshot
is retained at `.local/review-final.png`.

## Failure accounting and review boundary

Initial focused Activity stories had 12 failures out of 13: viewport inference
mounted all loaded rows, an icon assertion named the wrong public part, the
filter accessible name omitted its visible label, and pagination status was
inside list semantics. Explicit viewport binding and correct list/control
composition repaired these. Follow-up runs reduced failures to 2, then 1;
scroll restoration and measuring the position after card activation resolved
the remaining navigation case. The final focused lane has zero failures.

Three newly added navigation/merge journeys initially raced fixture population,
dialog visibility and post-command refresh. They now wait for those observable
states while preserving assertions; all 40 focused stories pass. Temporary
TypeScript declaration/prop errors and one file-budget failure were corrected;
the final check has zero errors, warnings or budget findings. No assertions,
a11y gates or visual baselines were weakened.

The final wider story lane exposed one mobile geometry assertion holding an
obsolete board node after the intended view reset; reacquiring the current board
preserved the assertion and passed the exact regression plus all 167 stories.
One browser test import reported an unexpected-token runner error; an unchanged
fresh exact run passed, followed by all 16 browser tests, without quarantine.
Canonical acceptance wording was condensed to the governed bullet/word limits;
the final specification validation and mapped checks pass.

Visual review remains pending. No screenshots were compared or baselines changed.
No push, publication or deployment is part of this slice. The user must approve
this UI before further live implementation.
