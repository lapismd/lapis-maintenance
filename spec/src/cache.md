# Local read cache

## LM-CACHE-001 — Turso WASM response caching

**Requirement.** The application MUST cache repository reads in a bounded local Turso WASM database without treating cached data as GitHub authority.

Persist branch-action summaries with assembled views under LM-UI-004, retaining cached badges during background refresh and recomputing legacy views without that field from the existing response cache.

Retain an attention queue: open PRs (including passing/draft PRs), failures, approvals, blocked, running and unavailable work remain; confirmed successful/skipped/neutral/cancelled workflows leave the board and saved views. Only complete PR or workflow inventories retire their absent identities, resources and references in other saved selections; unrelated optional-resource gaps do not block verified cleanup, while partial/denied inventories and uncertain outcomes do not prove resolution. Fence late retired-identity/revision writes. GitHub remains authoritative and commands never replay.

One shared Turso store and one shared IndexedDB store isolate logical token keys, each with at most 12.5 MiB of serialized keys/payloads, 1,000 records and 1 MiB per record, for 25 MiB combined persistent payload across tokens/backends. Each memory fallback is capped at 25 MiB/1,000 records; all stores enforce 24-hour retention during reads/writes and minute maintenance, including inactive logical partitions. Physical database/index/WAL and browser overhead are separate from the payload budget.

Repository/PR activity, GraphQL inventory batches and raw workflow inventories stay in a bounded 2 MiB/100-response/five-minute session cache; never persist a filtered body under the original ETag. Persist compact branch-action summaries independently of resolved workflow cards. Migrate the active legacy partition through the attention policy before deleting its old store; prune expired inactive legacy stores by app-owned names, leave locked files for retry and never touch credentials or another application's storage. Dispose maintenance timers and drain cleanup before closing.

Coordinator presentation uses a versioned v2 cache containing only the latest
and one previous distinct decision per repository, tagged as a host projection
while retaining original source/report identities; prune v1 full-history
resources and raw report responses on startup/maintenance, refuse new raw-report
cache writes, and never associate a filtered body with an HTTP ETag.
The five-minute derived cache still supports immediate reopening without GitHub
reads; explicitly stale/unavailable evidence retains the existing read-only
feedback and never grants command authority.

### Acceptance details

- Policy-versioned detail/review namespaces recompute action eligibility after upgrades while retaining eligible responses; resources publish verified results before persistence settles, drain writes before retirement, serialize same-partition Turso reopen after connection close and clear denied previews; persist reads, validators, assembled views and details separately from credentials, partitioned by token and repository selection; publish boards before discovery, checkpoint partial scans, serve fresh details directly and retain revision-matching details up to one day during revalidation with refresh/failure feedback, while commands bypass cached data.
- Bound storage, inventory and concurrency with pagination, validators, query-only GraphQL caching and rate-limit backoff; prioritize selected reads, promote shared queued requests and scope invalidation while preserving newer repository results against older scans; retain at most 100 full session previews for synchronous reopening before storage settles, matching selection, revision/attempt and repository version, expiring after one day; clear denied previews and bypass them during command validation.
- Online remembered sessions may show a token-partitioned read-only cached preview before authentication completes; provider reads and write authority require successful authentication, and cached previews never authorize commands; disconnect deletes the active partition and prevents late responses from repopulating it; denied resources invalidate cached results and partial data is visibly unavailable.

- Exercise real Turso persistence in a browser, including reload/clear; when Turso startup or isolation is unavailable, disclose and use bounded token-partitioned IndexedDB persistence, falling back visibly to memory only when both persistent stores fail; the app worker adds isolation headers and caches only public app assets separately from Turso; startup settles with bounded waiting and reload before accepting token input.
