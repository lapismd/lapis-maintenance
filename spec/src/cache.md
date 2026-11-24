# Local read cache

## LM-CACHE-001 — IndexedDB response caching

**Requirement.** The application MUST cache repository reads in bounded token-partitioned IndexedDB storage without treating cached data as GitHub authority.

Persist branch-action summaries with assembled views under LM-UI-004, retaining cached badges during background refresh and recomputing legacy views without that field from the existing response cache.

Retain an attention queue: open PRs (including passing/draft PRs), failures, approvals, blocked, running and unavailable work remain; confirmed successful/skipped/neutral/cancelled workflows leave the board and saved views. Only complete PR or workflow inventories retire their absent identities, resources and references in other saved selections; unrelated optional-resource gaps do not block verified cleanup, while partial/denied inventories and uncertain outcomes do not prove resolution. Fence late retired-identity/revision writes. GitHub remains authoritative and commands never replay.

One shared IndexedDB store isolates logical token keys with at most 25 MiB of serialized keys/payloads, 1,000 records and 1 MiB per record across tokens. Each memory fallback is capped at 25 MiB/1,000 records; all stores enforce 24-hour retention during reads/writes and minute maintenance, including inactive logical partitions. Physical database/index and browser overhead are separate from the payload budget; obsolete app-owned file caches are deleted without reading or migrating their contents.

Repository/PR activity, GraphQL inventory batches and raw workflow inventories stay in a bounded 2 MiB/100-response/five-minute session cache; never persist a filtered body under the original ETag. Persist compact branch-action summaries independently of resolved workflow cards. Migrate active legacy IndexedDB partitions through the attention policy before deleting their old stores; prune expired inactive legacy stores by app-owned names and never touch credentials or another application's storage. Dispose maintenance timers and drain cleanup before closing.

Coordinator presentation uses a versioned v2 cache containing only the latest
and one previous distinct decision per repository, tagged as a host projection
while retaining original source/report identities; prune v1 full-history
resources and raw report responses on startup/maintenance, refuse new raw-report
cache writes, and never associate a filtered body with an HTTP ETag.
The five-minute derived cache still supports immediate reopening without GitHub
reads; explicitly stale/unavailable evidence retains the existing read-only
feedback and never grants command authority.

LM-GH-004 optional scoped/source-hold fields are revalidated when compacting
retained evidence, including old v2 resources that previously accepted unknown
fields; invalid scoped data becomes unavailable and over-age scoped data stays
explicitly stale, while legacy reports and original audit/source identities keep
their existing retention and command-authority boundaries.

LM-GH-005 AutoCraft evidence retains only a validated presentation projection in
the existing token-partitioned resource cache. Raw report/policy reads bypass
response persistence; cached evidence is age-checked again before display.
Report provenance and worker source coordinates stay distinct, and cached queue
rows never supply command authority or enter the public asset cache.

### Acceptance details

- Policy-versioned detail/review namespaces recompute action eligibility after upgrades while retaining eligible responses; resources publish verified results before persistence settles, drain writes before retirement and clear denied previews; persist reads, validators, assembled views and details separately from credentials, partitioned by token and repository selection; publish boards before discovery, checkpoint partial scans, serve fresh details directly and retain revision-matching details up to one day during revalidation with refresh/failure feedback, while commands bypass cached data.
- Bound storage, inventory and concurrency with pagination, validators, query-only GraphQL caching and rate-limit backoff; prioritize selected reads, promote shared queued requests and scope invalidation while preserving newer repository results against older scans; retain at most 100 full session previews for synchronous reopening before storage settles, matching selection, revision/attempt and repository version, expiring after one day; clear denied previews and bypass them during command validation.
- Online remembered sessions may show a token-partitioned read-only cached preview before authentication completes; provider reads and write authority require successful authentication, and cached previews never authorize commands; disconnect deletes the active partition and prevents late responses from repopulating it; denied resources invalidate cached results and partial data is visibly unavailable.

- Exercise real IndexedDB persistence in a browser, including reload, partition isolation and clear, falling back visibly to memory only when persistent browser storage fails; keep the app worker's public asset cache separate from repository data.
