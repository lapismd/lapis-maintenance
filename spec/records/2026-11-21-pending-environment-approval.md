# Pending protected-environment approval discovery

## Live evidence

The reported `lapismd/lapis-plugin-tasks` `registry-release.yml` workflow uses a
`workflow_run` trigger on `main` and gates its publish job on the protected
`registry-production` environment. GitHub reports the user as an eligible
required reviewer. Run 44948548086 subsequently completed successfully after
the protected transition.

## Repair

GitHub may surface a protected-environment transition as `pending` rather than
exactly `waiting`. Discovered current-head `pending` runs now query their exact
pending deployments and render eligible approve/reject actions. The existing
current-head inventory is reused, avoiding an additional repository-wide
request per refresh. Commands still re-read the exact run, attempt, environment
and reviewer eligibility immediately before writing.

## Verification

- The new `read-port.test.ts` fixture matches a `workflow_run` on `main`, a
  `pending` `registry-production` deployment and an eligible reviewer; it failed
  before the repair because no approval item existed.
- `pnpm exec vitest run --project unit src/github/read-port.test.ts src/github/workflow-authority.test.ts src/github/branch-actions.test.ts`: 3 files and 32 tests passed, including unchanged request bounds.
- Repository-wide check, unit, browser, Storybook, production build and PWA
  results are recorded in the accompanying IndexedDB cache record.
