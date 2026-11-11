# Lapis Maintenance

A static Svelte dashboard for maintenance across LapisMD repositories, using
Design Core's AppShell/Kanban and Repository UI's shared forge panels and checks.
The complete roadmap is in [PLAN.md](PLAN.md); canonical requirements and current
verification are in [the specification](spec/src/index.md).

Open the [dashboard](https://lapismd.github.io/lapis-maintenance/) or
[fixture Storybook](https://lapismd.github.io/lapis-maintenance/storybook/).

Slice 1 is approved; **Slices 2 and 3 are implemented and ready for review**.
Hosted CI and Pages delivery are verified. The application connects to
GitHub with your token for live reads, remembers it on this device when selected,
and caches repository responses in Turso WASM. The user additionally authorized
Slice 3 PR/CI writes in the production app and local live story, required
dependency publication and Pages hosting. Release actions and PWA installation
remain gated by later slice approvals.

## Development

Use Node 24.15.0 and pnpm 10.34.5; tools and CI Actions are pinned.

```sh
pnpm install --frozen-lockfile
pnpm run doctor
pnpm spec:search --semantic "shared checks and token session"
pnpm check
pnpm test
pnpm test:browser
pnpm test:storybook
pnpm build
pnpm build-storybook
pnpm spec:check
pnpm dev
```

The app runs at <http://127.0.0.1:7511>; `pnpm storybook` opens the local
catalog at <http://127.0.0.1:7510>. Open **Maintenance → Live → GitHub session**
to test production login and the live dashboard with your own token.
The story restores a remembered session for that Storybook origin; disconnect
through profile settings to return to login. It has no token args or automatic
play function and is excluded from automated runs and published Storybook.
`pnpm preview` serves the production build at
<http://127.0.0.1:7512/lapis-maintenance/>. Use an explicit different port in
another checkout instead of stopping its server. Chromium is required for
browser/interaction tests (`pnpm exec playwright install chromium`).

## Connection and local data

Login authenticates `/user` before exposing cached data, and displays the GitHub
name and avatar. Fine-grained tokens cover one resource owner; grant repository
read permissions for the relevant PR/check/status/Actions/environment APIs.
Repositories or endpoints outside token access remain visibly unavailable.
The app and local live story support confirmed draft readiness, review approval,
request-changes/comment, merge, workflow approval, rerun and cancellation. Give a token
Pull requests write permission for PR actions, Contents write for merges and
Actions write for workflow operations; GitHub enforces the token's actual scope.
Merge eligibility also requires successful complete checks, an allowed method
and clean repository rules. Reviews/merges carry the displayed commit SHA;
readiness and workflow APIs provide no atomic revision/attempt condition, so
their targets are re-read immediately before submission. Accepted reruns and
cancellations are distinct from completion; uncertain responses are never
replayed. Fixture stories retain in-memory simulations.

The remember option stores the token in a dedicated local browser record.
Disconnect in the profile menu clears that record, the active cache and fetched
controller data. Tokens never enter snapshots, Storybook args or the response
cache. Reload authenticates the remembered token again before cache reuse.

Defaults come from dependency-automation's current allowlist, including the
coordinator, with explicit additions/exclusions in Repository settings. Holds
remain visible. Search, multi-select repositories, statuses and the Activity
view share one dataset. Repository and status filters both support multiple selections.
Repository settings use allowlist checkboxes plus explicit additions/exclusions.
PR, workflow and deployment inspectors use the same
bordered, detachable frame and grouped checks. PR-associated checks retain the
merge controls, disabled until eligible; the inspector footer does not duplicate
merge. The header status control shows the latest line and a count, opening an
icon timeline of holds, coverage gaps, loading, connection errors and action
feedback. Repositories appear while activity loads. Old PR workflow branches are
excluded; remaining coverage warnings identify the workflow, run and branch.

Turso stores token-partitioned API bodies, ETags and pagination/freshness metadata
in OPFS, including assembled views and card details for quick reload/reopen.
Inventory queries cover current default-branch/PR revisions and pending approvals.
Fresh reads are reused for five minutes; manual refresh forces
conditional revalidation. The timer runs only while visible, requests have
bounded concurrency and rate-limit backoff, and selected workflow jobs use the
identified attempt. Unsupported or failed persistence visibly falls back to
memory. Cache rows and total storage are bounded; old records are pruned.

The published isolation bootstrap adds COOP/COEP headers where hosting cannot;
it never caches requests or responses. Pages hosting is authorized separately;
PWA installation and offline acceptance remain future work.

## Ownership and component catalog

The app owns credentials, domain state, controllers, adapters and preferences.
Design Core owns shell/Kanban/controls; Repository UI owns the shared forge
frame, grouped checks, PR presentation and profile menu. Production components
never import catalog fixtures. Standalone component stories and complete screens
use the same toolbar, inbox, inspector, navigation, board, filter and detail
components. See [component composition](catalog/components/README.md) and
[third-party notices](THIRD_PARTY.md).

Shared forge UI comes from published `@lapismd/repository-ui` `^0.2.0`, released
through [Agent UI PR #22](https://github.com/lapismd/agent-ui/pull/22) and the
independently versioned [v0.2.2 cohort](https://github.com/lapismd/agent-ui/tree/v0.2.2).
The manifest and lockfile resolve ordinary registry artifacts. Frozen-install,
source/provenance and application acceptance evidence is in
[the release record](spec/records/2026-11-11-release.md).
