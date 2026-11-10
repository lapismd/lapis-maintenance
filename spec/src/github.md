# GitHub and token sessions

## LM-GH-001 — In-memory authenticated reads

**Requirement.** Planned Slice 2 MUST use one user-supplied token at a time for direct browser GitHub
REST requests and narrowly scoped GraphQL operations.

### Acceptance details

- Identify the user; reload requires reconnecting; disconnect clears secrets, fetched data and pending reads; Resource-owner access gaps remain visible.
- Discover defaults from dependency-automation's current allowlist, include the coordinator, and allow additions/exclusions while retaining hold reasons.
- Read PRs, current-head checks/statuses/reviews, runs and environment waits; superseded failures cannot represent the active revision/attempt.
- Manual and five-minute visible refresh use bounded concurrency, pagination, conditional requests and rate-limit backoff; partial coverage is explicit.
