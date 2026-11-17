# Current repository decisions and toast feedback

Owners: LM-OPS-001, LM-UI-001, LM-CTRL-001, LM-CACHE-001, LM-GH-004,
LM-PR-001, LM-PR-002, LM-FEED-001, LM-ACT-001, LM-REL-001, LM-ACT-003
and LM-GOV-001.

## Diagnosis and policy

The live Operations view rendered all 643 historical coordinator decisions,
although its current report described 19 repositories. Operation IDs were unique;
the repetition was audit history, not a duplicate network append. For mira-mde,
the first displayed observation was from November 15 while the current value
was observed on November 17. The user selected one latest row per repository
with one previous decision available in expanded details.

The browser projection now groups repository names case-insensitively and
selects by parsed observation time before applying filters. Timestamp ties use
the later report entry, operation IDs are distinct, and only the current and
one previous decision survive. Expanded details include status, time, reason,
source and custom-label identifier controls, with bottom spacing below the timestamp. Current and previous observations use
public Design Core RelativeTime, retaining exact dates in its keyboard/hover
tooltip. Batch footer actions retain one row in constrained layouts, with
truncated labels and their full accessible/hover text. Releases and publication events
retain their distinct semantics; the upstream audit report remains unchanged.

The live snapshot projects 643 decisions to 38 across 19 repositories. Serialized
report JSON drops from 628,185 to 194,542 bytes. Derived coordinator resource v2
stores that projection; legacy v1 and raw HTTP report history are removed and
rejected on writes/sweeps. Legacy snapshots also compact embedded coordinator
evidence. Filtered HTTP bodies never retain the original ETag. Fresh reopening
of the compact derived resource makes zero additional provider requests.

Inspector PR review actions also retain one compact row, shorten the visible
comment label and omit the footer explanation while preserving action reasons
in accessible descriptions and hover titles.

## Notification audit

Duplicate raw repository errors below Operations issues are removed. Shared
Design Core NotificationToasts now presents repository/session errors, coordinator
coverage warnings, cached review/detail refresh errors, activity paging errors,
individual/batch command receipts, dispatch discovery/results and settings-save
failures. Login and form input validation, loading/empty recovery UI and disabled
action explanations remain contextual. Toast actions only retry reads or open
logs/identified links; they never submit or replay mutations.

A session-owned feedback center deduplicates unchanged failures through pending
refreshes and command IDs across panes. Recovery dismisses resolved errors and
re-arms later failures. Four visible records expire after ten active seconds,
pause on focus/hover, support keyboard dismissal and retain at most 100 full
messages in the status log. Timers/state are disposed and never persisted.
The existing public notifications and RelativeTime entries are prebundled for
cold startup.

## Regression evidence

- Before implementation, coordinator retention had two unit failures and the
  one-current-row browser case failed. Exact targets now pass, including three
  cache cases, four decision-selection cases and six report parser cases.
- The initial toast browser case failed on the inline HTTP 422 paragraph. It
  now checks no inline error, one toast across repeated refresh, full status-log
  details, recovery and keyboard dismissal. Four feedback policy browser cases
  cover deduplication, active-time expiry/disposal, bounds and explicit actions.
- Initial new story selectors were corrected to match accessible identifier
  labels and scope errors to Operations content; popover visibility is awaited.
  The recovery fixture now returns immutable snapshots and waits for the success
  render before introducing a later failure. Existing outcome assertions now
  target the portaled notification region rather than removed inline banners.
- A cold populated Storybook run confirms one latest decision with the previous
  value and shared identifier pairs in expanded details. Dark/narrow feedback
  opens the full status log from its toast without inserting a page banner.

## Qualification

All 244 unit, 35 browser, 220 Storybook interaction/accessibility and seven
production PWA cases pass (506 total, zero failures). The full Storybook run's
six obsolete inline-feedback assertions were migrated to the notification region
and pass without removing their behavior checks. The compact action slice's two
initial label failures pass in its exact 34-case story target. The 400-line
catalog budget is preserved by a separate current-decision story file; no story
coverage or assertions were dropped.

Frozen installation, formatting, source boundaries, Svelte diagnostics, production
and static Storybook builds and canonical specification checks are delivery
gates. Hosted CI and exact merged-main Pages verification follow local
qualification. Changed stories remain visual-pending; no screenshots or baselines
are compared.
