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
