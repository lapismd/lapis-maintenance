# Compact PR heading — 2026-11-14

The user requested the PR number alongside the title, removal of the repository
context row above it, and relocation of the status badge. Their final choice
keeps Approve PR at its existing size and places Open/Draft/Merged in the page's
top toolbar beside the breadcrumbs. Breadcrumb buttons also have padding around
their hover/focus backgrounds, applied at rest to prevent hover layout shifts.

The shared local ReviewWorkspace and ReviewShell render this presentation in
all preview stories. Removed context-row styling is unused; title spacing now
starts directly at the header's top inset. The displayed number and state come
from existing controller data. No command behavior, adapter, cache, dependency,
live application integration or deployment is changed.

## Verification

Node 24.15.0 and pnpm 10.34.5. The installed/latest Deno-free spec-validator
remains 0.2.0, its doctor passes 11 checks with 0 warnings, and semantic
specification search returns QMD-backed results.

| Command                                                                                                            | Result                                                                           |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `pnpm exec vitest run --project storybook catalog/Review.stories.ts catalog/components/ReviewWorkspace.stories.ts` | Before/after: 19 passed; heading assertions now include the displayed PR numbers |
| `pnpm check`                                                                                                       | Formatting, source/file budgets, 0 type errors and 0 warnings                    |
| `pnpm test`                                                                                                        | 96 passed                                                                        |
| `pnpm test:storybook`                                                                                              | 144 interaction/accessibility cases passed                                       |
| `pnpm build` / `pnpm build-storybook`                                                                              | Passed; existing large-chunk advisory remains                                    |
| `pnpm spec:check`                                                                                                  | Validation, architecture, book and mapped spec-first checks pass                 |

The compact-button experiment was superseded by the user's final choice; the
action component is restored to the preceding verified implementation. There
were no functional or accessibility failures in the focused lanes. Browser/PWA
storage suites were not repeated for this unmounted Storybook presentation
change; their adapter/session/cache boundaries are untouched.

Manual acceptance uses a fresh Storybook page and covers the title/status
positions, unchanged Approve PR control, padded breadcrumb feedback and
constrained layout. Screenshot evidence remains local; no screenshot comparisons
or baseline updates were made. This is committed locally and awaits UI review;
main is unchanged and nothing is pushed or deployed.
