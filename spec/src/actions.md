# Write actions

## LM-ACT-001 — PR and workflow writes

**Requirement.** Authorized Slice 3 MUST permit individual user-activated readiness, review, merge, auto-merge scheduling/cancellation,
failed-job rerun, workflow-run approval and cancellation through the supplied token.

Action outcomes follow LM-UI-001 toast policy across individual and batch
surfaces; contextual input validation remains with the form. Feedback never
executes or retries a mutation.

### Acceptance details

- The production app and manual live story share the command adapter; one-click actions capture repository, PR/run, revision and selected method before submitting; only permanent deletion needs confirmation, while comments/change requests and dispatch use one input submission; fixtures remain explicitly simulated.
- Command adapters own one action-specific preflight that bypasses response caches immediately before writes; reviews, merges and auto-merge enable send the displayed SHA, while readiness and workflow APIs receive an immediately revalidated target and dispose-aborted commands cannot start a write because they offer no atomic revision/attempt condition.
- Respect permissions, holds, required reviews and merge queues; PR approval requires reported current-revision checks, merge attempts require an open non-draft PR, repository write access and an allowed method while GitHub enforces approval/check rules, and waiting CI approval supports same-repository automation and forks with its exact run/attempt action; environment review is authorized by R2 and manual dispatch is authorized by the original release slice.
- Prevent duplicate or concurrent submissions, force-refresh only the affected repository and selected item after a result, distinguish completed, accepted, rejected and uncertain outcomes, and never replay uncertain writes; validation always bypasses previews and cache, with mocked HTTP/browser acceptance.

## LM-REL-001 — Release approvals and manual dispatch

**Requirement.** Authorized Slice 4 and R2 environment review MUST permit deployment review and dispatch of existing manual
workflows through the supplied token and owning workflow contracts.

Dispatch discovery warnings, rejected submissions and accepted/uncertain results
follow the same toast policy, preserving the workflow target link and input form.

### Acceptance details

- Approve/reject only currently pending environments the user may review.
- Discover active workflow_dispatch definitions through safe YAML parsing and render required/default/choice/boolean/number/environment inputs; require an explicit branch or tag, bind input-form submission to its commit and workflow definition SHA, revalidate input contracts immediately before one POST, reject changed targets, never replay uncertain dispatches and link the identified run or workflow Actions page while distinguishing submission from publication.
- Signing keys and publication credentials remain in owning GitHub workflows.

## LM-ACT-003 — Individually validated batch targets

**Requirement.** Batch commands MUST include only individually eligible reruns or workflow/environment approvals and revalidate every immutable target immediately before writing.

### Acceptance details

- One explicit batch activation captures each eligible repository, source SHA, run attempt and environment; environment approval comments default empty, with eligibility from live command ports rather than coordinator reports.
- Execute each activated target at most once, retain separate completed/accepted/rejected/uncertain receipts, reject concurrent submissions, stop on disposal and never replay uncertain targets; a partial failure cannot erase earlier results.
