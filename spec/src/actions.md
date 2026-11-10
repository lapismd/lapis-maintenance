# Write actions

## LM-ACT-001 — PR and workflow writes

**Requirement.** Planned Slice 3 MUST permit individual user-confirmed readiness, review, merge,
failed-job rerun and workflow cancellation through the supplied token.

### Acceptance details

- Re-read the target before writes; reviews/merges bind the displayed SHA and workflow operations bind the displayed attempt.
- Respect token permissions, required reviews, repository rules and merge queues.
- Prevent double submission, refresh affected data after effects, distinguish acceptance from completion, and never replay uncertain writes automatically.

## LM-REL-001 — Release approvals and manual dispatch

**Requirement.** Planned Slice 4 MUST permit deployment review and dispatch of existing manual
workflows through the supplied token and owning workflow contracts.

### Acceptance details

- Approve/reject only currently pending environments the user may review.
- Discover workflow_dispatch inputs and require explicit branch/tag and review of the operation; link the resulting run and distinguish publication status.
- Signing keys and publication credentials remain in owning GitHub workflows.
