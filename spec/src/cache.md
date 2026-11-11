# Local read cache

## LM-CACHE-001 — Turso WASM response caching

**Requirement.** The application MUST cache repository reads in a bounded local Turso WASM database without treating cached data as GitHub authority.

### Acceptance details

- Persist reads, validators, assembled views and selected details separately from credentials, partitioned by token and repository selection; publish assembled views before discovery and checkpoint partial scans for reload, serve fresh details directly and show revision-matching cached details immediately during revalidation up to one day old, clearly marking refresh/failure while permission denial clears the preview and commands always bypass cached data.
- Bound inventory, storage and concurrency while retaining pagination, validators and rate-limit backoff; prioritize selected-item reads ahead of queued background work, promote shared queued reads without duplication, and scope post-command refresh/invalidation to the affected repository while preserving newer scoped results against older full scans.
- Authenticate before cache reuse; disconnect deletes the active partition and prevents late responses from repopulating it; denied resources invalidate cached results and partial data is visibly unavailable.
- Exercise real Turso persistence in a browser, including reload/clear; when Turso startup or isolation is unavailable, disclose and use bounded token-partitioned IndexedDB persistence, falling back visibly to memory only when both persistent stores fail; the app worker adds isolation headers and caches only public app assets separately from Turso; startup settles with bounded waiting and reload before accepting token input.
