# Inbox attention, running work and filtered summaries

Owner: LM-UI-001, LM-CTRL-001 and LM-OPS-001.

The Inbox attention surface is one non-expandable row, aligned with the toolbar
controls. Counts and the Operations action remain; the duplicate evidence reason
and detailed node timeline are available on Operations. Narrow layouts retain the
row and accessible icon action while removing supplementary text as needed.

Running work has its own Kanban column. Completed and cancelled items remain in
Activity, and empty Running columns follow the existing collapsed defaults.
Header summaries now use the controller's visible items, including repository,
branch-action, search, card-status and view filters. Changing scope makes no
provider request and grants no action authority.

## Regression ledger

Before product edits, `pnpm test src/maintenance/summary.test.ts
src/maintenance/board.test.ts` failed both tests: repository selection retained
global counts and the Running lane was absent. The original presentation target,
`pnpm test:storybook catalog/InboxPresentation.stories.ts
catalog/Operations.stories.ts -t 'Attention Summary|Inbox|Narrow|Dark'`, had four
failures, two passes and 14 deselected cases: the attention row remained expandable
and its inset did not align with the toolbar. No assertion or visual threshold was
weakened. Final exact and complete lane results are recorded after qualification.

The repaired unit target passes both tests. The first presentation rerun passed
five cases with one narrow-layout failure: the header retained 12px of padding
after the body inset changed. Aligning the app-owned responsive context inset
repaired the unchanged exact target: six passed, zero failed, 14 deselected.
The board/filter target initially passed seven cases and exposed one new Running
accent contrast failure; the contrast-safe theme mixture repairs that exact target
to eight passed, zero failed. Initial qualification also caught one unsupported
test-query option and one specification prose word-budget violation; both were
corrected without changing checks or limits.

The preview now remains on Inbox after its geometry assertions, with the real
attention-to-Operations navigation covered by the production-screen browser
journey (one passed). Keeping the dark board visible exposed a failing-lane
accent contrast issue in the app's supplied color; theme-aware foreground mixtures
for failure and progress accents retain readable labels in both themes. The
unchanged dark-preview accessibility assertion remains a delivery gate.

## Final local qualification

The retained-Inbox preview first passed two cases and failed the dark contrast
case; after the app-owned accent repair all three preview cases pass. The complete
final lanes pass 227 unit tests, 20 browser cases, 214 Storybook interaction/
accessibility cases and seven production PWA tests, with zero failures. The
attention-to-Operations browser journey and both original unit regressions pass.
Types, formatting, architecture/file budgets, both production/static builds and
all four canonical specification lanes pass. Doctor passes all 11 checks and QMD
semantic search works with the released validator.

A fresh Storybook process at port 7517 renders the populated Inbox with the
aligned single row and a separate populated Running lane. Hosted CI, merge and
Pages use the normal checked-head delivery gate under standing user approval.

Fixtures cover 1074px, narrow and dark shells, row geometry/navigation, the Running
lane, empty column defaults and reactive summary counts after filtering/reset.
Stories remain visual-pending without screenshot comparison or baseline changes.
Spec Validator was refreshed from registry 0.2.0 to the latest Deno-free 0.2.1 before
canonical checks; production dependency ranges remain unchanged.
