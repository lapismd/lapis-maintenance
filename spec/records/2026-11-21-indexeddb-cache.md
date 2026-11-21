# IndexedDB cache simplification

## Scope

The user selected IndexedDB as the application's persistent browser cache and
requested removal of the Turso implementation and its fallback warning.

## Implementation

- IndexedDB is the sole persistent GitHub-response cache and opens without a
  fallback notice. Memory remains a visible session-only fallback only when
  IndexedDB itself is unavailable.
- The shared IndexedDB payload budget is 25 MiB across 1,000 token-partitioned
  records, with the existing 1 MiB record limit and 24-hour retention.
- The WASM database dependency, SQL adapter, connection lease, source/tests,
  startup selection and current documentation references were removed.
- Obsolete app-owned file caches are deleted without reading or migrating their
  contents; unrelated browser files and credentials remain untouched.
- The public-worker handoff remains independent of repository data caching and
  continues to protect explicit PWA updates and unsent login input.

## Verification

- `pnpm exec vitest run --project browser src/cache/indexeddb-cache.browser.test.ts`: 5 passed, including silent IndexedDB startup, reopen, bounds, memory fallback and obsolete-file cleanup.
- `pnpm test:browser`: 16 files and 40 tests passed.
- `pnpm check`: formatting, architecture and Svelte diagnostics passed with no warnings.
- `pnpm test`: 67 files and 288 tests passed.
- `pnpm build`, `pnpm build-storybook`, `pnpm test:storybook`: production build, static Storybook and 53 files/232 interaction-accessibility tests passed.
- `pnpm test:pwa`: 7 passed, including explicit waiting-worker update, offline shell and CacheStorage boundaries.

Spec Validator 0.2.1 is the latest published Deno-free release. Its repository
checks pass; the local doctor separately reports the machine-wide QMD native
module ABI mismatch, so specification discovery used the documented `rg`
fallback without changing product validation.
