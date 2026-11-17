# Attention queue retention and bounded browser storage

Owners: LM-CACHE-001, LM-GH-001, LM-GH-002, LM-CTRL-001,
LM-SESSION-001, LM-PR-002 and LM-GOV-001.

The browser audit found payload limits per token database, expiry only at open,
no aggregate memory byte limit, persisted resolved workflow cards/history, and
no retirement of inactive token stores. Brave reported 75.5 MB for the shared
lapismd.github.io origin; that was not a Maintenance-only account-data measure.
The deployed public PWA inventory separately contained 236 assets / 22.93 MiB.

## Implementation

Live repository reads and saved views retain open PRs (including passing/draft
PRs), failures, approvals, blocked, running and unavailable work. Confirmed
successful/skipped/neutral/cancelled workflows leave the board; compact default
branch health remains independent. Complete PR and workflow inventories retire
their absent identities independently of optional-resource gaps, remove related
details/review/check resources, rewrite other saved selections, and fence late
writes. Partial inventories retain unverified attention rows. Existing uncertain
receipt/no-replay behavior and fresh command preflights remain authoritative.

Logical token namespaces share one Turso backend and one IndexedDB backend,
each limited to 12.5 MiB/1,000 records, including serialized keys and values.
Their combined payload cap is 25 MiB; one record is at most 1 MiB. Physical
database/index/WAL and browser overhead are separate. A Web Lock coordinates
the shared Turso connection: another tab immediately uses bounded IndexedDB.
Memory fallback is limited to 25 MiB/1,000 records and each synchronous preview
map to 5 MiB/100 entries. Raw workflow/GraphQL inventories and Activity history
use a 2 MiB/100-response/five-minute session cache without modifying ETag bodies.

Reads, writes and minute maintenance expire 24-hour data, including inactive
logical token partitions. The active legacy store migrates through the attention
policy before its files/database are removed. Hourly legacy cleanup considers
only expired app-owned stores, deferring locked files and leaving credentials,
other applications and public asset caches alone. Old-build clients can retain
legacy stores until unlocked/expired; the new payload cap does not include that
transition or browser file overhead. Disposal drains cleanup and stops timers.

## Regression evidence

- Before editing, `pnpm exec vitest run --project unit
src/cache/retention-regression.test.ts` failed all three cases: completed
  workflow persistence, memory byte eviction and expiry in an open session.
  All three exact cases now pass.
- `src/cache/retained-cache.test.ts` covers whole-response/ETag boundaries,
  resolved entities and cross-selection references, partial-read safety,
  late-write fencing, timer disposal and preview byte budgets.
- `src/cache/retention.browser.test.ts` exercises real Turso/IndexedDB shared
  budgets, token isolation and scoped clear, expiry without reopen, inactive
  token cleanup, both legacy migrations and another tab's Turso lease.
- `src/github/attention-inventory.test.ts` proves the live inventory omits
  resolved workflows while keeping passing open PRs and verified branch health.
- Wider validation found the cached-restore fixture still expecting a resolved
  cancelled card (three restore cases) and one merge interaction retaining a
  merged PR during an unrelated resource gap. The fixture now represents the
  attention queue; independent inventory coverage repairs the merge behavior.
  The original merge browser case passes, with its zero-items assertion intact.
- Browser files run serially because real cache acceptance now shares one
  origin-wide store/budget. Explicit tests retain token and tab concurrency
  coverage. No screenshot comparisons, visual thresholds or baselines change.

## Local qualification

All 236 unit tests, 29 browser cases, 217 Storybook interaction/accessibility
cases and seven production PWA tests pass with zero failures; the original
three retention regressions and merge browser interaction pass unchanged.
Format, architecture budgets and Svelte diagnostics pass with zero errors or
warnings; production and static Storybook builds pass from fresh processes.
Frozen installation and all four canonical specification lanes pass; Doctor
passes all 11 checks and QMD semantic search works with validator 0.2.1.
Hosted CI and Pages acceptance follow the standing approved delivery gate.
