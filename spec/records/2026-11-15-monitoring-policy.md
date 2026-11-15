# Shared monitoring policy adoption

Owner: LM-GH-003 and LM-GH-001. Source: dependency-automation PLAN.md, S1/S4.

The coordinator now publishes monitoring-only repositories and default exclusions
separately from dependency-update authority. This adapter consumes that policy,
preserves held consumers, legacy configurations and explicit operator choices,
and accepts the real `.github` repository without allowing path traversal.

Original target: `pnpm exec vitest run --project unit
src/github/repository-discovery.test.ts`. Before implementation: 1 passed,
3 failed. After implementation: 4 passed, 0 failed. Wider qualification remains
in progress. The initial spec search failed with ENOSPC under `/tmp`; redirecting
temporary files to a task-specific directory restored search and doctor passed
11/11. No existing temporary data was deleted.

Initial wider specification validation exposed the verifier's single-table
contract (16 unmapped rows after adding a second table); combining the new row
with the existing verification table repaired validation. Spec-first then named
the required dashboard/controller mappings; their monitoring/read-authority
contracts were updated. These failed qualification attempts remain recorded.
The first mapping update exceeded the four-bullet acceptance limit in two
chapters; moving the policy cross-reference into their requirement prose
preserved the existing acceptance lists without changing validator limits.
No new commands or write authority are introduced. Wave/issue/report UI is still
planned; this change only adopts the shared discovery policy.

## Local qualification

- `pnpm check`: formatting and boundaries passed, zero Svelte/type errors or warnings.
- `pnpm test`: 188 tests passed in 42 files.
- `pnpm test:browser`: 18 tests passed in 11 files.
- `pnpm test:storybook`: 175 interaction/accessibility scenarios passed in 40 files.
- `pnpm build`, `pnpm build-storybook`: passed; existing large-chunk warnings retained.
- `pnpm test:pwa`: seven tests passed against the fresh production build.
- `pnpm spec:check`: validation, source boundaries, mdBook and spec-first passed.

Browser/Storybook used fresh processes with task-specific temporary storage.
No screenshot comparison or baseline update was performed. Hosted CI and Pages
qualification remain pending; LM-GH-003 stays In progress until they pass.
