# One-click actions and joined check borders

The user approved pulling remote changes and implementing the confirmation audit
on 2026-11-15. Work starts on main 4b65439b, including the Operations batch view.
This amendment supersedes historical confirmation-only interaction requirements.

## Interaction and command behavior

An exhaustive action-kind policy runs every existing non-input action on the
first explicit activation: readiness, PR approval, all merge methods, auto-merge
enable/disable, rerun/cancel, workflow approval and environment approve/reject.
Only permanent deletion would require confirmation; no current command deletes
content. Comments/change requests and manual dispatch retain required-input forms
with a single submission. Workflow dispatch still binds explicit ref, commit,
definition and typed inputs; optional environment approval comments default empty.

Both dashboard and review controllers snapshot targets/methods before execution,
lock synchronously against duplicate clicks and show action-specific pending
icons. Sequential batches capture eligible distinct targets immediately, retain
individual receipts and stop on disposal. Existing command adapters retain fresh
preflight and GitHub permissions, revision and repository-rule enforcement.
No credentials, cache namespaces or GitHub mutation payloads change.

Input forms keep text/ref/values after definite rejection. An explicit retry gets
a new request identity against the same captured target; accepted and unknown
results cannot replay. Review unknown-target guards survive relabeling, changes
to merge method and navigation to another item. Read/mount/filter/navigation paths
remain non-writing. Automated acceptance uses fixture ports or mocked HTTP only.

Check groups own a stable upper border outside the animated button. Expanded
content owns its row separator, keeping header height/borders unchanged during
disclosure; adjacent groups and the merge footer retain
one shared pixel boundary. Closed group chevrons point right, switching down when
opened. The same component serves PR and inspector views.

## Regression ledger

- Pulled-main baseline: 24 focused controller/batch tests and 18 action/dispatch/
  Operations stories passed.
- First API regressions failed against the previous prepare/confirm contract;
  the first implementation passed four new immediate-action tests and 30 focused
  unit tests across seven files. The first story pass covered 27 scenarios.
- Unknown-result relabel/navigation regression: one failed, four passed before
  repair; subsequent focused coverage adds input validation, retry identity,
  retained rejection values and uncertain-input no-replay.
- Border regression against pulled-main CSS: one failed, five passed; the joined
  edge measured two pixels instead of one. The repaired inspector regression
  verifies collapsed adjacent/footer edges and expanded row separators.
- Refactoring command lifetime out of the resource controller retained the file
  budget. A fake timer fixture initially referenced a non-existent command object;
  it now mutates its own pending field and preserves the timer/disposal assertions.
- Type checks found a missing required description in the new dispatch fixture;
  it was supplied without changing product types. Spinner styles use the owned
  icon class, avoiding unused scoped selector warnings. A disclosure assertion
  now waits for its asynchronous CSS state before checking the same one-pixel edge.

A fresh populated Storybook process at port 7516 verified collapsed headers with
single shared separators and first-click fixture workflow approval
with accepted feedback and no confirmation dialog. Visual review remains
visual-pending; no screenshot comparisons or baselines change.

## Validation and delivery

Frozen install, formatting, source boundaries/file budgets and Svelte diagnostics
pass. Full lanes pass: 209 unit tests, 19 browser tests, 184 Storybook interaction
and accessibility scenarios, seven PWA tests, production/static Storybook builds,
semantic specification search, doctor and mapped specification checks.

The first full Storybook run found eight obsolete confirmation expectations
(176 passed); all were updated to verify one-click execution and original
outcomes, then the focused 43-scenario and full 184-scenario lanes passed.
The chevron regression first failed (five passed); the final inspector lane
passes all six scenarios, verifying direction, shared borders and invariant
header height on open/close. During concurrent specification generation, one
browser run observed duplicate restore inventory reads (18 passed); its exact
cold rerun and the serialized full browser lane pass without changing product
cache behavior or relaxing the assertion. Specification validation caught an
83-word acceptance bullet, shortened within its existing 80-word budget.
No functional or accessibility failure is deferred.

Hosted CI on the exact pushed PR head gates merging. Merged-main CI, Pages and
artifact/PWA acceptance gate delivery completion; receipts remain local to the
validation session rather than claiming a future deployment in this record.
