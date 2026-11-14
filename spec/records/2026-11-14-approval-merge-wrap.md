# Workflow approval, merge selection and inspector wrapping

The user authorized the remaining real implementation, push, green-head merge
and Pages acceptance on 2026-11-14, then reported disabled workflow approval,
three separate merge buttons and clipped inspector content.

## Changes and authority

GitHub reports lapismd/lapis-notes PR #115 run 43635983231 attempt 1 as completed
with conclusion action_required, on the same public repository's automation
branch. The previous fork-only provenance gate disabled this valid target.
The adapter now accepts verified public same-repository and fork PR identities,
retaining current open PR, SHA, branch, base repository, run attempt and actor
permission validation. A fresh command preflight remains mandatory.
A read-only live probe confirmed availability with four reads and zero writes;
no user workflow was approved or executed for this investigation.

One shared local merge control composes public ButtonGroup and DropdownMenu.
Selecting an allowed method only updates the primary action; clicking it opens
the existing identified-target confirmation, and only confirmation can submit.
GitHub retains authority over approval, checks and repository merge rules.
Inspector grid columns can shrink, long titles can break, and the complete
review summary appears as wrapped text with a short status badge rather than
inside a nowrap badge. Derived detail/review policy namespaces are versioned
so old disabled eligibility is recomputed without discarding raw API caches.

## Regression ledger

- Baseline focused authority/command tests: 24 passed.
- New same-repository authority regression before fix: 1 failed / 11 passed;
  new merge/long-content stories before fix: 2 failed / 8 passed, including an
  approximately 2140px inspector overflow in about 438px available width.
- Initial post-change run: two authority explanation assertions failed; the
  concrete repository explanation was corrected without weakening assertions.
  The first Storybook run was interrupted by ENOSPC and is not passing evidence.
- Focused story retries exposed initial-resource and overlay transition timing;
  waits now observe the actual menu disposal and visible confirmation without
  suppressing pointer checks or weakening geometry/effect assertions.
- Final focused result: 31 unit tests and 10 interaction/accessibility stories
  passed; command integration submits once for the current target and rejects
  changed attempts, changed heads and lost permission before any write.
- Full browser run initially had 1 failed / 16 passed plus five runtime errors
  from late optimization mixing two Svelte module generations; the narrow
  production-session merge test passed warm, then passed cold after adding
  the new public control entries to the established app/Storybook prebundle
  lists, retaining the assertions and original timeout.

Cold populated Storybook inspection at port 7516 confirmed wrapped title/hash
and complete summary, the selected method appearing on the primary button,
no confirmation on method selection, and the matching explicit merge effect
when the primary button is clicked; confirmation was cancelled. Visual review
remains visual-pending; no screenshot comparisons or baselines were changed.

## Final local validation

Frozen install preserves the registry lockfile; formatting, source boundaries,
file budgets and Svelte diagnostics pass with zero warnings/errors. Full lanes:
170 unit tests, 17 browser tests, 172 Storybook interaction/accessibility stories
and 7 built-app PWA tests pass. Application and static fixture-only Storybook
builds, specification search/doctor and mapped spec checks pass. All regressions
above are resolved; no failed functional/accessibility lane is deferred.

The delivery sequence requires CI on the pushed PR head before merge, then
merged-main CI/Pages and hosted artifact/PWA acceptance. Local read-only probe
receipts and hosted acceptance output remain outside version control in .local;
actual workflow approval continues to require explicit user confirmation.
