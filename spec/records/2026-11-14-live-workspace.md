# R3/R4 live workspace and manual workflow dispatch

The approved local review components now compose the production token session.
The host owns inventory, PR review, workspace activity and dispatch lifetimes;
retirement aborts them before draining response/resource writes and closing or
clearing the token partition. Settings, PWA controls, theme, authenticated avatar
and disconnect remain available. Published and automated stories stay fixtures.

PR overview, current-head checks, pending approvals and timeline pages use
independent caches with synchronous warm previews, stale refresh feedback and
selection/revision/attempt keys. Permission denial clears the affected preview;
head changes discard mismatched checks. Persistence no longer delays verified
reads, cannot resurrect denied/old-epoch data and is drained at session teardown.
Intent prefetch waits 150ms and shares transport reads independently of consumer
cancellation. Selected pending checks refresh at 45 seconds only while visible.

Hash routes identify PR and tab, retain board filters for Back, and repository
navigation exits the workspace. Existing readiness/review/comment/merge/rerun/
cancel actions remain, with actual repository merge methods and independently
identified workflow/environment targets. Real confirmations show the PR/run,
revision, effect and environment; one command adapter owns fresh authority.

Workspace activity lazily merges paginated GitHub repository-event streams,
filters before emission, retains cursor positions without event buffers or
credentials in routes, reports unknown global totals and partial feed coverage,
and labels workflow status observations rather than fabricating historical
workflow events. PR activity uses paginated issue timeline events with avatars
and actual GitHub targets; file views remain direct links to GitHub.

Manual dispatch discovers active workflow definitions through JSON/base64
Contents responses and safe YAML parsing, supports required/default/choice/
boolean/number/environment inputs, requires an explicit branch/tag and confirms
its commit plus workflow blob identity. Fresh validation checks the ref and both
selected/default definitions before one POST through the shared command queue.
Changed definitions, invalid inputs and aborted preflights do not write;
uncertain results cannot replay. Accepted dispatch links an API-identified run,
a unique matching new run, or honestly the workflow when no run is identified.
The harmless dispatch-only acceptance workflow has no checkout, secrets,
publication or repository permission and uses a designated review environment.

## Local evidence

- Controlled 20-PR inventory: 86 REST requests versus 27 batched requests,
  a 68.6% reduction with identical classified statuses/targets. Fresh resource
  reopening uses zero provider requests, including synchronous retained checks.
- Final unit lane: 164 passed; browser lane: 17 passed, including real persistent
  browser caches, remembered sessions, live confirmed merge and hash Back.
- Full Storybook interaction/accessibility: 170 passed; cold populated light,
  dark and narrow views inspected on a fresh process at port 7515. Visible check
  rows end at y=751.4 and merge footer begins at y=751.4: no overlap. No screenshot
  comparison or baseline change; stories remain visual-pending.
- Seven production PWA tests cover installability, offline/account isolation,
  asset-only CacheStorage, explicit update, migration, routes and delayed boot.
- Frozen registry install, doctor (11 checks), types (0 errors/warnings), format,
  architecture/budgets, app/static Storybook and mapped specifications pass.
- Failure ledger: a cache denial race (1 failed / 146 passed) was fixed by moving
  warm publication before persistence and preventing queued preview resurrection;
  the later overlapping-epoch regression also passes. Dispatch lookup initially
  omitted the workflow_runs response field (2 failed); exact cases now pass.
  Three Activity stories exposed a second fixture query during inventory startup
  (3 failed / 167 passed); source-discovery rebinding is now live-only, preserving
  the original assertions and disposable fixture behavior (12/12 repaired).
- Specification bullet/count/word limits and initial type/file-budget findings
  were repaired without weakening governance or assertions.

Hosted exact-head CI, merged-main Pages/PWA delivery, real populated resource
measurement and designated environment/dispatch acceptance are the remaining
release qualification steps, performed after this local implementation commit.
Positive cross-user/fork approval requires a genuinely eligible external target;
mocked authority coverage does not claim a second account or invented wait.

## Cached-target handoff regression

Final audit found that an independently cached approval could outlive its
inventory row. The bridge now restores only the immutable PR/run/environment
identity with empty capabilities; the single command adapter still supplies
fresh authority. Regressions cover restored environment identity, directly
routed PRs and rejection of cross-repository/malformed identities. The focused
preflight/restore set passes 3 tests; the complete unit lane now passes 164.

An authenticated read-only probe against PR #2 at 9fffc99d measured five cold
requests in 1,076 ms, zero fresh-reopen requests in 0.07 ms, one linked check,
11 timeline entries and a successful one-request GraphQL summary. These are
one-run measurements, not a latency guarantee; controlled request-count and
persistent-browser regressions remain the acceptance gates.
