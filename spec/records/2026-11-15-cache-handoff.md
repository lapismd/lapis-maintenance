# Turso cache connection handoff

The first hosted run of PR 8 failed the existing remembered-session browser
acceptance: 18 passed, one failed because remounting repeated eight inventory
reads. This reproduced the earlier intermittent local failure despite its cold
rerun passing, disproving the provisional assumption that documentation rebuild
interference alone explained it. No assertion is waived or relaxed.

A new narrow real-WASM regression starts reopening the same partition while the
previous session still owns its connection, delays retirement by 100 ms, then
closes it. Before repair, one browser regression timed out after 20 seconds while
the ordinary persistence test passed. This matches the worker connection/close
contention that makes bounded startup choose another store and lose that
partition's warm response cache.

The application-owned Turso adapter now serializes connection lifetime per
partition within the page. A successor waits for the previous close; opening
failure and close completion release ownership. Independent partitions remain
independent. Startup timeout, late-open cleanup, IndexedDB fallback, cache keys,
credential isolation, retention and command freshness remain unchanged.

After repair, the two real-Turso regressions and the exact remembered-session
browser test pass together (three tests). The adversarial reopen retains the
Turso backend and reads the previously persisted value. The existing app test
still requires exactly two authentication reads, zero extra inventory requests
on remount, and credential removal on disconnect.

Full local and hosted gates are rerun on the resulting PR head before merge;
no retry count or timing threshold is loosened to mask this failure.

## Final local qualification

Formatting, source boundaries, Svelte diagnostics and mapped specification checks
pass. Full lanes pass: 209 unit tests, 20 browser tests, 184 Storybook interaction
and accessibility scenarios, seven PWA tests and both production/static builds.

A local broad run under competing browser work hit an import failure and a
persistence-test stall; the following browser launch failed before running any
tests. After those processes exited, the exact affected four tests and the full
20-test browser suite passed with one test file at a time. No assertions,
retry counts or time limits changed. Hosted CI uses its standard configured
browser lane and must pass on the new head before merge.
