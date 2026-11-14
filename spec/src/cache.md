# Local read cache

## LM-CACHE-001 — Turso WASM response caching

**Requirement.** The application MUST cache repository reads in a bounded local Turso WASM database without treating cached data as GitHub authority.

### Acceptance details

- Independent resources publish verified results before persistence settles, drain writes before retirement and clear denied previews; persist reads, validators, assembled views and details separately from credentials, partitioned by token and repository selection; publish boards before discovery, checkpoint partial scans, serve fresh details directly and retain revision-matching details up to one day during revalidation with refresh/failure feedback, while commands bypass cached data.
- Bound storage, inventory and concurrency with pagination, validators, query-only GraphQL caching and rate-limit backoff; prioritize selected reads, promote shared queued requests and scope invalidation while preserving newer repository results against older scans; retain at most 100 full session previews for synchronous reopening before storage settles, matching selection, revision/attempt and repository version, expiring after one day; clear denied previews and bypass them during command validation.
- Online remembered sessions may show a token-partitioned read-only cached preview before authentication completes; provider reads and write authority require successful authentication, and cached previews never authorize commands; disconnect deletes the active partition and prevents late responses from repopulating it; denied resources invalidate cached results and partial data is visibly unavailable.

- Exercise real Turso persistence in a browser, including reload/clear; when Turso startup or isolation is unavailable, disclose and use bounded token-partitioned IndexedDB persistence, falling back visibly to memory only when both persistent stores fail; the app worker adds isolation headers and caches only public app assets separately from Turso; startup settles with bounded waiting and reload before accepting token input.
