# Write actions

## LM-ACT-001 — PR and workflow writes

**Requirement.** Authorized Slice 3 MUST permit individual user-confirmed readiness, review, merge,
failed-job rerun, workflow-run approval and cancellation through the supplied token.

### Acceptance details

- The production app and manual live story share the command adapter; confirmations identify the real effect, repository, PR/run, revision and merge method before submission; fixture confirmations remain explicitly simulated.
- Bypass the response cache to re-read the target and its capabilities immediately before writes; reviews and merges send the displayed SHA, while readiness and workflow APIs receive an immediately revalidated target because they offer no atomic revision/attempt condition.
- Respect permissions, holds, required reviews and merge queues; PR approval requires reported current-revision checks, merges require complete successful checks and an allowed method with clean eligibility, and waiting CI approval uses its own exact run/attempt action, including from PR details; deployment approval/dispatch remains gated by Slice 4.
- Prevent duplicate or concurrent submissions, force-refresh affected data, distinguish completed, accepted, rejected and uncertain outcomes, and never replay uncertain writes; validate with mocked HTTP/browser journeys before acceptance on isolated disposable targets.

## LM-REL-001 — Release approvals and manual dispatch

**Requirement.** Planned Slice 4 MUST permit deployment review and dispatch of existing manual
workflows through the supplied token and owning workflow contracts.

### Acceptance details

- Approve/reject only currently pending environments the user may review.
- Discover workflow_dispatch inputs and require explicit branch/tag and review of the operation; link the resulting run and distinguish publication status.
- Signing keys and publication credentials remain in owning GitHub workflows.
