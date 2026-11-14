# Auto-merge and compact sidebar checks

The 2026-11-14 request adds PR auto-merge controls, non-wrapping merge options
and collapsed check groups in the inspector. Existing authorization covers
implementation, push, green-head merge and hosted Pages qualification.

## Behavior and command authority

The inspector passes a presentation prop to the shared check panel so its status
groups start closed for each selected item, retaining the outer summary and PR
merge controls. Groups remain individually expandable; the main PR Checks tab
keeps its existing disclosure behavior. Merge-menu content uses intrinsic width
with a minimum width and non-wrapping options through the public controls.
The PR overview now reuses the same merge footer as Checks and the inspector.

The shared control offers Enable auto-merge and the selected merge method, or
Disable auto-merge and the current schedule's method/actor. Existing REST PR and
repository responses supply scheduling state, repository opt-in and permissions,
without extra inventory or detail requests. Derived cache policy versions
recompute action eligibility after upgrade while preserving raw responses.

Only explicit identified-target confirmation submits a command. The existing
adapter freshly reads the PR and repository before scheduling, requires an open
non-draft writable PR, permitted merge method and no hold, and sends GitHub's
enablePullRequestAutoMerge mutation with the exact PR node and expectedHeadOid.
A successful schedule is accepted, distinct from a completed merge. Disabling
revalidates the current head, actor and schedule, including allowing a held
repository's existing schedule to be stopped. GitHub retains branch/check/review
and token-permission authority; unknown results are never replayed.

GitHub schema introspection verified expectedHeadOid on the current enable
input. A production-adapter read-only preflight for lapismd/lapis-notes PR #115
reported enable availability and all three methods using four reads and zero
writes. No real PR schedule or repository setting was changed during testing.

## Regression ledger

- Baseline: 34 focused unit tests and 10 action/inspector stories passed.
- New command regressions before implementation: 5 failed / 7 passed; story
  regressions: 3 failed / 9 passed for missing auto-merge, expanded sidebar
  groups and wrapping menu text; a text-node-only geometry assertion also
  reproduced the menu wrapping before implementation.
- Focused command, policy and controller tests now pass, covering all three
  methods, exact head/node inputs, confirmation, duplicate submission, changed
  head/permissions/settings/draft/method, cancellation and uncertain no-replay.
- Story iteration corrected ambiguous status-text matching and waited for
  enabled controls after asynchronous refresh, retaining pointer checks;
  production-session acceptance waits for refreshed schedule state before
  checking the write count and uses the actual singular one-item heading.
- The new navigation story exposed missing controls on the main PR Overview;
  it now uses the same production footer and the complete focused review
  family passes 36 stories, including both views and menu geometry.
- Type checking required labels for both new action kinds in the central
  fixture map; the controller exceeded the 300-nonblank-line budget by two
  lines, resolved by moving the resource guard into the preparation helper
  without relaxing either constraint. All narrow targets were rerun.

Cold populated Storybook at port 7516 verified closed sidebar groups, single-line
merge options, controls in the PR overview and sidebar, and Rebase carried into
the identified auto-merge confirmation; that manual confirmation was cancelled.
Visual review remains visual-pending; no comparisons or baselines changed.

## Final local validation

Frozen install, formatting, source boundaries/file budgets and Svelte diagnostics
pass. Full lanes pass: 184 unit tests, 18 browser tests, 175 Storybook interaction
and accessibility stories, 7 PWA tests, application/static Storybook builds,
specification search/doctor and mapped specification checks. No functional or
accessibility failure is deferred. CI on the pushed PR head gates merge; merged
main CI/Pages and hosted artifact/PWA verification gate delivery completion.
