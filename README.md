# Lapis Maintenance

A controller-driven maintenance dashboard for LapisMD repositories.

The complete roadmap is in [PLAN.md](PLAN.md); requirements and their actual
verification status live in [the specification](spec/src/index.md).
The current product slice is **Storybook only**. Future GitHub reads/writes,
token sessions, Pages deployment and PWA support require separate approval.

## Development

Use pnpm 10.34.5. The workspace pins its command runtime to Node 24.15.0.

```sh
pnpm install --frozen-lockfile
pnpm run doctor
pnpm spec:search --semantic "controller and adapter boundaries"
pnpm check
pnpm test
pnpm test:storybook
pnpm build-storybook
pnpm spec:check
pnpm storybook
```

Storybook uses <http://127.0.0.1:7510>. Set `--port` explicitly for another
checkout rather than stopping another workspace's process. Browser tests use
Playwright Chromium (`pnpm exec playwright install chromium`).

## Ownership

The application owns domain state, controller lifetime, ports, future GitHub
adapters and hosting. Design Core owns shared components; imports use its public
registry exports. Catalog fixtures must never enter production components.
Real tokens are neither needed nor accepted by the Slice 1 demo session.

No public deployment exists yet. Storybook is a local review deliverable.

## Slice 1 review

The inbox uses public Design Core Kanban with read-only status lanes. The
inspector joins Main using AppShell's attached variant. PR details and the
profile footer use published Repository UI components from the Agent UI repo.
Workflow checks adapt Repository UI 0.1.1's private PR checks presentation to the
dashboard's own workflow data: compact divided rows, semantic state icons,
expandable summary, revision and read-only refresh. No private package imports
are used. See [third-party notices](THIRD_PARTY.md) for adapted source licenses.
Repository filters support multiple selections, mirrored in the left navigation.
Activity uses public Kanban Activity to group current records by latest update.
Eligible PRs expose Merge in the fixed inspector footer; the review/merge story
demonstrates required approval and refreshed eligibility before confirmation.
The transparent sidebar retains the shell background; its logo is the Lapis
asset from `lapis-desktop/public/lapis-logo.svg` (same workspace, AGPL).

Profile/login, approvals, merges and workflows are all in-memory simulations.
Storybook includes retry, permission, stale-target and uncertain-result examples.
No real token input, network adapter, service worker or deployment is included.

The canonical source-boundary audit runs in both `check` and `spec:check`.
