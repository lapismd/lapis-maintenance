# R2 live action and link implementation

Authorization: the 2026-11-14 continuation approves real implementation,
push, green-head merge and the remaining original release slice.

Workflow waits recognize action-required status or conclusion and validate an
unambiguous open PR, current head/branch and public fork/base provenance before
presenting approval. Ordinary failures, private/same-repository origins, changed
heads, closed PRs and missing provenance cannot borrow this capability.
Environment reviews use GitHub's current reviewer flag rather than push role;
the command revalidates the run attempt and exact pending environment and
submits only that environment ID, distinguishing accepted review from completion.

Check/status/job targets are retained, skipped jobs remain passed, unrelated
resource coverage cannot erase verified checks, and deployment/write errors
include bounded GitHub messages and permission headers without credentials.
Merge attempts are independent of blanket approval/check gating, preserving
explicit holds, open/non-draft state, actor role and repository merge methods;
GitHub remains authoritative for protections and merge queues. Readiness uses
the already revalidated draft identity instead of an additional PR read.

## Evidence

- Baseline: 39 focused tests passed before implementation.
- New workflow authority regression: 9 failed / 2 passed before the change,
  then 11 passed after the fix; broader GitHub tests: 74 passed.
- Deployment regressions cover exact POST IDs/body, changed attempt/environment,
  lost eligibility, removed waits, permission diagnostics, duplicate request IDs
  and uncertain outcomes without replay; check-link regression covers job and
  status destinations and skipped results.
- Full unit lane: 125 passed; browser lane: 16 passed; full Storybook interaction
  and accessibility lane: 167 passed; formatting, architecture, file budgets,
  types, app/static Storybook builds and mapped specification checks pass.
- One existing linked-PR story still expected local check gating; its expectation
  now follows the user's explicitly approved merge-attempt behavior, while tests
  retain fresh-target, permissions, explicit holds and rejected-server coverage.

No real release operation was used for implementation tests. Combined live
workspace, dispatch, designated disposable acceptance, hosted CI and Pages
qualification follow in R3/R4 and the release slice before delivery.
