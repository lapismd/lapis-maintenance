# Storybook review refinements — 2026-11-14

The user's follow-up review requested Community-style activity with avatars and
background-free details, a smaller one-row summary, separation above inspector
approvals, and a header-only GitHub icon in PR metadata. These are local UI
refinements to R1; live adapter/action/performance work and deployment still
await separate approval.

## Changes

- `ReviewActivity` composes public Design Core Avatar with optional actor-image
  metadata, retaining initials when absent; local illustrated image fixtures
  make no external image requests. Author/action bylines, nearby timestamps,
  unboxed body copy and the avatar rail follow Community's project activity
  feed. Community was inspected read-only; its unrelated changes are untouched.
- Summary labels are Items, Approvals, Failures and Reviews, with full labels
  retained as titles. Smaller spacing/icons/counts and four columns at every
  width replace the former two-row breakpoint; constrained labels ellipsize.
- The inspector approval footer has a top separator and margin; PR metadata's
  accessible GitHub icon sits at the right of the card header, replacing its
  text link below the details.
- Added dark/narrow activity stories and avatar-image/pagination/fallback
  coverage; a 320px summary story asserts four aligned tiles inside the frame.
  The shared fixture host only adds optional width control.

## Verification

Node 24.15.0 / pnpm 10.34.5. Registry metadata confirms spec-validator 0.2.0 is
still latest; its doctor passes 11 checks with 0 warnings and semantic search
uses QMD. Manifests, lockfile, live startup and sibling packages are unchanged.

| Command                                                                                                           | Result                                                                  |
| ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `pnpm exec vitest run --project storybook catalog/components/Summary.stories.ts -t Constrained`                   | Before: 1 failure (two rows); after: 1 passed, 2 intentionally filtered |
| `pnpm exec vitest run --project storybook catalog/components/ReviewActivity.stories.ts catalog/Review.stories.ts` | Before: 20 passed; after: 22 passed including new presentations         |
| `pnpm check`                                                                                                      | Formatting, architecture and type checks pass                           |
| `pnpm test`                                                                                                       | 96 passed                                                               |
| `pnpm test:browser`                                                                                               | 16 passed                                                               |
| `pnpm test:storybook`                                                                                             | 150 interaction/accessibility cases pass                                |
| `pnpm build`                                                                                                      | Passed; existing large-chunk advisory remains                           |
| `pnpm build-storybook`                                                                                            | Passed                                                                  |
| `pnpm test:pwa`                                                                                                   | 7 passed                                                                |
| `pnpm spec:check`                                                                                                 | Validation, architecture, book and mapped spec-first pass               |

The first post-change activity run optimized the newly imported public Avatar
entry mid-run and reloaded the iframe, failing its first 16 cases; that tainted
run was stopped. Adding the public entry to the existing Storybook/test
prebundle lists restores a fresh 22/22 run without timeout or assertion changes.
The dedicated Storybook process was restarted after its startup config changed.

Manual inspection covers activity, light/dark/narrow presentations, header-link
alignment, compact summary with inspector open, and the separated footer.
Review remains at <http://127.0.0.1:7514/>. Screenshots are local review evidence;
no comparisons or baselines were created. Changes are committed locally and
not pushed or deployed; R1 user approval remains pending.
