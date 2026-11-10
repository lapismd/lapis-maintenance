# Local read cache

## LM-CACHE-001 — Turso WASM response caching

**Requirement.** The application MUST cache repository reads in a bounded local Turso WASM database without treating cached data as GitHub authority.

### Acceptance details

- Persist read payloads, validators, assembled dashboard views and selected details separately from credentials; partition by token and repository selection, restore fresh views/details without API reconstruction and render stale views during revalidation, while five-minute expiry and explicit refresh revalidate reads and commands always bypass the cache.
- Bound inventory to the current default-branch revision, open PR heads and pending approvals, retaining pagination/deduplication and validators; bound concurrency/storage and honor reset/Retry-After, preserving cached responses on rate exhaustion without replaying writes.
- Authenticate before cache reuse; disconnect deletes the active partition and prevents late responses from repopulating it; denied resources invalidate cached results and partial data is visibly unavailable.
- Exercise real Turso persistence in a browser, including reload/clear; failed storage falls back visibly to memory; the isolation worker adds required headers without caching responses or credentials, and startup settles before accepting token input to prevent a late bootstrap reload from clearing the form.
