# Simplified PR preview and navigation — 2026-11-14

The user replaced the embedded Files view with a GitHub link and requested
white card bodies, a circular icon-only Back control, and repository breadcrumbs.
This remains a local Storybook UI review; live GitHub integration/deployment
and subsequent slices await approval.

## Delivered changes

- PR sections are Overview, Checks and Activity. Files on GitHub opens the
  displayed PR's `/files` page in a new tab. Removed the embedded file/diff
  component, CSS, ports/models/controller state, fixtures and dedicated stories.
  The complete plan and future live workspace requirement now delegate files
  and diffs to GitHub rather than retaining an unused implementation.
- Description, metadata and approval bodies use the white background surface
  in the light theme while following the background token in dark mode.
- Back is a round icon control with a tinted background and darker hover/focus.
  It preserves the previous board filters. Public Breadcrumb composition adds
  All repositories → repository → PR; repository/root controls return to the
  inbox with the corresponding repository filter and close the inspector.
- Remaining activity/approval/check behavior is preserved. Navigation only
  changes fixture controller state and never writes to GitHub. No live adapter,
  session, persistence, sibling package or dependency version changed.

## Evidence

Node 24.15.0 / pnpm 10.34.5. Registry confirms spec-validator 0.2.0 remains
latest; doctor passes 11 checks with 0 warnings and semantic search uses QMD.

| Boundary                                          | Result                                                                                       |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Exact review controller test                      | Before/after: 8 passed; optional activity loading, pagination and no-write coverage retained |
| Exact main/workspace/files stories before removal | 25 passed                                                                                    |
| Exact main/workspace stories after removal        | 18 passed                                                                                    |
| Main/workspace stories with breadcrumb journey    | 19 passed; changed-files URL/new-tab target and repository/root filters verified             |
| `pnpm check`                                      | Formatting, architecture, 0 type errors and 0 warnings                                       |
| `pnpm test`                                       | 96 passed                                                                                    |
| `pnpm test:browser`                               | 16 passed                                                                                    |
| `pnpm test:storybook`                             | 144 interaction/accessibility cases passed                                                   |
| `pnpm build` / `pnpm build-storybook`             | Passed; existing large-chunk advisory remains                                                |
| `pnpm test:pwa`                                   | 7 passed                                                                                     |
| `pnpm spec:check`                                 | Validation, architecture, book and mapped spec-first pass                                    |

Seven file-view stories were intentionally retired with the removed feature;
one breadcrumb interaction story was added, giving 144 total cases. Its first
run found one query failure: the public Breadcrumb uses the accessible name
`breadcrumb`, not the supplied custom label, and the one-item board uses the
singular heading. The story now uses those actual public labels while retaining
the filter/count/navigation assertions; 19/19 pass without relaxed timeouts.
The published Breadcrumb entry is prebundled with tabs/avatar for cold startup;
the removed diff entry is no longer prebundled. The dedicated Storybook process
was restarted before manual acceptance. Final specification validation found an
83-word acceptance clause above its 80-word limit; it was condensed without
changing the requirement or validation rules, then the same check was rerun.

Manual review covers the three tabs, GitHub file link, card surfaces, Back and
breadcrumb navigation in light/dark and constrained layouts. Local screenshot
evidence is ignored; no comparisons or baselines were updated. The verified
change is committed locally, with main unchanged and no push or deployment.
