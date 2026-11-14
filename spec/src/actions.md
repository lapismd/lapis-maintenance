# Write actions

## LM-ACT-001 — PR and workflow writes

**Requirement.** Authorized Slice 3 MUST permit individual user-confirmed readiness, review, merge,
failed-job rerun, workflow-run approval and cancellation through the supplied token.

### Acceptance details

- The production app and manual live story share the command adapter; confirmations identify the real effect, repository, PR/run, revision and merge method before submission; fixture confirmations remain explicitly simulated.
- Command adapters own one action-specific preflight that bypasses response caches immediately before writes; reviews and merges send the displayed SHA, while readiness and workflow APIs receive an immediately revalidated target and dispose-aborted commands cannot start a write because they offer no atomic revision/attempt condition.
- Respect permissions, holds, required reviews and merge queues; PR approval requires reported current-revision checks, merge attempts require an open non-draft PR, repository write access and an allowed method while GitHub enforces approval/check rules, and waiting CI approval uses its own exact run/attempt action, including from PR details; environment review is authorized by R2 and manual dispatch is authorized by the original release slice.
- Prevent duplicate or concurrent submissions, force-refresh only the affected repository and selected item after a result, distinguish completed, accepted, rejected and uncertain outcomes, and never replay uncertain writes; validation always bypasses previews and cache, with mocked HTTP/browser acceptance.

## LM-REL-001 — Release approvals and manual dispatch

**Requirement.** Authorized Slice 4 and R2 environment review MUST permit deployment review and dispatch of existing manual
workflows through the supplied token and owning workflow contracts.

### Acceptance details

- Approve/reject only currently pending environments the user may review.
- Discover active workflow_dispatch definitions through safe YAML parsing and render required/default/choice/boolean/number/environment inputs; require an explicit branch or tag, bind confirmation to its commit and workflow definition SHA, revalidate input contracts immediately before one POST, reject changed targets, never replay uncertain dispatches and link the identified run or workflow Actions page while distinguishing submission from publication.
- Signing keys and publication credentials remain in owning GitHub workflows.
