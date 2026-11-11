# Cached reload and inspector follow-up — 2026-11-11

## Observed causes and authorized changes

Read-only inspection of the open hosted page found crossOriginIsolated false,
SharedArrayBuffer unavailable, and an activated worker whose navigation response
was not intercepted. The app correctly disclosed its memory-only fallback, which
cannot survive reload. Separately, a fresh assembled-view hit waited for allowlist
discovery before notifying the controller, and interrupted scans saved raw reads
without checkpointing the assembled cards.

- Keep Turso preferred. If startup cannot use it, open a token-partitioned bounded
  IndexedDB cache; disclose browser storage and use memory only if both persistent
  stores fail. Credentials remain outside repository data stores and cache partitions.
- Publish cached boards before discovery, checkpoint partial scans and restore
  their completed cards. Progressive updates apply during initial and background
  refresh; card indicators track repository/selected-detail work independently.
- Keep the right resize indicator transparent through app-owned presentation.
- The checks overlap comes from Repository UI accepting Core 0.7.4 alongside the
  app's 0.12.4. The old runtime drops viewportProps, leaving a 1546 px viewport
  without independent scrolling. Correct the package floor upstream and consume
  its registry release; do not add a consumer alias or checks selector repair.

## Failure ledger

- `pnpm exec vitest run --project unit src/github/cached-reload.test.ts`:
  2 failures before, 2 passes after (fresh publication and partial restoration).
- Exact long-check consumer Storybook interaction: 1 failure before intake;
  scrolling, footer separation and last-row containment remain required.
- Background-refresh stories initially exposed 1 dark-mode accessibility failure:
  the fixture emitted synchronously before the host theme settled. Matching the
  normal asynchronous read boundary fixed the fixture; contrast rules stayed on.
- The new app reload test first timed out because its mocked discovery was served
  from the raw-JSON media cache, so the intended network gate was never entered.
  Invalidating that synthetic media entry made the test exercise the deferred
  path. The card and spinner visibility assertions remain intact.
- One fixture type annotation failed checking, then passed with the explicit
  snapshot type. No diagnostics, accessibility rules or baselines were weakened.
- Cold manual Storybook review found a dynamic `storybook/test` import that
  the dev builder could not resolve. A static import repaired it; the exact
  three cache/overlap stories passed again, and built-story browser review
  completed without runtime errors.
- A first resize-rail probe ran in the constrained replacement layout, where
  no handle exists. The final browser test uses the desktop resize layout and
  proves transparent hover/focus while retaining keyboard width changes.
- The final published-package PWA run exposed one reconnect-test race: the
  login form became visible before the saved-token request started. The test
  now waits for the mocked rejection before retaining its exact one-request
  assertion; offline zero-request and hidden-account assertions are unchanged.

## Temporary source-package acceptance

An ignored copy of the app consumed a diagnostic Repository UI tarball from
source commit d1660eb8cb2fbe0524bcbd32b6e44b657fe58aa7. Its SHA-256 was
3c73c36184061bb52227ca7e23e1dceb8babf85a2e98bbd054b06bda26d2d202.
The tarball used the source package's 0.2.0 metadata and corrected Core floor;
it is not a registry release or a delivered dependency override. All 3 focused
cache/overlap stories and all 89 app interaction/accessibility stories passed.
Normal manifests and lockfiles await the published registry intake.

## Local evidence

- Real browser fallback tests cover close/reopen, token isolation, concurrent
  writes, prefix invalidation, explicit clear, oversized values, byte-budget
  eviction and final memory fallback when storage is denied.
- A remembered-session remount authenticates a synthetic user, reopens the real
  IndexedDB partition, displays cached cards while discovery is blocked, and
  clears visible spinners when the gate opens. No real token or writes are used.
- A unit test interrupts a full scan after one repository and restores the saved
  card with remaining repositories pending. Older/disposed progress stays gated.
- The normal graph passed 78 unit tests, nine storage/session browser tests and
  the separate inspector keyboard/hover regression. All seven PWA tests passed.
- Static Storybook with the corrected diagnostic package passed manual checks
  at 1800 × 988 and 975 × 988. The checks viewport was 384 px high with 1546 px
  of scroll content; scrolling to the final check retained its content above
  the merge footer. Both runs made zero GitHub requests and had no page errors.
- Initial QMD semantic discovery completed. Final `pnpm run doctor` reported
  nine passes and two QMD availability warnings in the resumed environment;
  specification lookup used the documented `rg` fallback. Formatting, types,
  architecture and all four specification lanes passed. Registry intake and
  hosted qualification are recorded after the release completes.

Slice 4 release-action UI remains unapproved. Changed stories remain
visual-pending; no screenshot comparisons or baseline updates are used.

## Published dependency intake

The runtime correction merged as Agent UI PR #24, followed by version PR #25.
All eight hosted lanes passed on version-PR run 43120015080 and exact merged
source `7128e5e0c96e661bc3630352084704d254deb3b0` in run 43122963061.
Release run 43123096382 published Agent UI 0.2.3 and Repository UI 0.2.1, then
verified registry bytes, clean installation, signatures and provenance.

Registry metadata initially returned 404 after successful publication. The
existing verifier completed when propagation settled; publication was not
replayed. The resumed environment also required the pinned pnpm 10.34.5 binary
and the existing local store path for installation. No package/store setting
or source override was added to the repository.

Maintenance now consumes Repository UI `^0.2.1` through its registry lockfile.
It shares Core 0.12.4 with the application; the old Core 0.7.4 graph is removed.
The public release receipt is retained in
`2026-11-11-runtime-registry-receipt.json`. Frozen installation and the exact
three cache/overlap stories passed against the published package.

Final published-package qualification on 2026-11-12 passed 78 unit tests,
10 browser tests, all 89 Storybook interaction/accessibility cases, all seven
PWA cases and the exact repaired offline-reconnect case. App and fixture-only
Storybook builds, formatting, types, architecture and specification checks
complete the delivery gate. The static inspector review passed again against
this registry-backed graph at both widths, with zero GitHub requests or page
errors; `2026-11-12-cached-inspector-receipt.json` retains the measurements.
