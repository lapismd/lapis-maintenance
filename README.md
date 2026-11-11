# Lapis Maintenance

[![CI](https://github.com/lapismd/lapis-maintenance/actions/workflows/check.yml/badge.svg)](https://github.com/lapismd/lapis-maintenance/actions/workflows/check.yml)
[![App](https://img.shields.io/badge/app-open-2563eb)](https://lapismd.github.io/lapis-maintenance/)
[![Storybook](https://img.shields.io/badge/storybook-live-ff4785?logo=storybook&logoColor=white)](https://lapismd.github.io/lapis-maintenance/storybook/)
[![License: AGPL v3](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE.md)

A maintenance inbox for GitHub repositories. See pull requests that need review,
failed builds and approval waits in one place, then act on the current revision.
Built with Svelte 5, [Design Core](https://github.com/lapismd/design-core) and
[Repository UI](https://github.com/lapismd/agent-ui).

[Open the app](https://lapismd.github.io/lapis-maintenance/) ·
[Explore Storybook](https://lapismd.github.io/lapis-maintenance/storybook/)

## What it does

- An inbox, Kanban board and activity view across your selected repositories.
- Search, multiple repository/status filters, grouped checks and PR details.
- PR reviews, merges, draft readiness, workflow approvals, reruns and cancellation,
  with explicit confirmation and current-target verification.
- GitHub's repository rules and permissions remain authoritative. Release
  environment approvals and manual workflow dispatch are planned.

## Connect GitHub

Enter a personal access token in the app. Requests go directly from your browser
to GitHub; there is no application server. Fine-grained tokens cover one resource
owner, and inaccessible repositories are shown explicitly.

Use repository read access for metadata, pull requests, checks, commit statuses,
Actions and environments. Actions require Pull requests write, Contents write
for merges and Actions write for workflows. [Manage GitHub tokens](https://github.com/settings/personal-access-tokens).

“Remember token on this device” stores the token in this browser, separately from
repository data. Use **Disconnect** in the profile menu to remove it and clear the
active cache. Only remember a token on a device you trust.

Repository reads use a token-partitioned Turso WASM database with five-minute
freshness, conditional requests, bounded storage and rate-limit backoff. Fresh
cached details open immediately; manual refresh revalidates them. GitHub actions
always re-read their target. Cached cards remain visible during background refresh,
with an indicator on cards being re-fetched. Where Turso cannot start, a bounded
IndexedDB cache preserves data across reloads; memory is the final fallback if
both persistent stores are unavailable.

## Install the app

Open the [live app](https://lapismd.github.io/lapis-maintenance/), then choose
**Install app** when offered or use your browser's install menu. Chrome and Edge
support installation from the address bar. In Safari on macOS, use **File → Add
to Dock**; on iPhone/iPad, use **Share → Add to Home Screen**.

The installed app opens in its own window. Offline startup shows a reconnect
screen; GitHub data and actions require a connection. The service worker caches
only public app assets, separately from the remembered token and Turso database.
It excludes authenticated responses, repository data and Storybook.

When a new version is ready, choose **Reload update**. Updates wait so they do not
interrupt forms or running commands. Installation and storage are per browser
profile and origin.

## Development

Use Node **24.15.0** and pnpm **10.34.5**.

```sh
pnpm install --frozen-lockfile
pnpm dev          # app: http://127.0.0.1:7511
pnpm storybook    # fixtures: http://127.0.0.1:7510
```

The local-only **Maintenance/Live → GitHub session** story mounts the production host for
manual token testing. It is excluded from hosted Storybook and automated tests.
Never put real tokens in fixtures, args or screenshots.

```sh
pnpm check
pnpm test
pnpm exec playwright install chromium
pnpm test:browser
pnpm test:storybook
pnpm build
pnpm test:pwa
pnpm build-storybook
pnpm spec:check
```

The production build uses `/lapis-maintenance/` and hash navigation. CI deploys
checked main output and fixture-only Storybook to GitHub Pages. PWA tests serve
the real build without server isolation headers and exercise offline startup,
cache exclusions, installation metadata, legacy migration and deferred updates.
Use `pnpm pwa:icons` to regenerate install icons from the Lapis vector logo.

## Architecture and specifications

The host owns credentials, adapters, persistence and controller lifetime.
`MaintenanceController` owns dashboard state; read and command ports allow the
same screens to run against GitHub or disposable in-memory Storybook fixtures.
Public Design Core and Repository UI components provide the shell, Kanban,
profile, grouped checks and PR panels.

See the [implementation plan](PLAN.md), [canonical specifications](spec/src/SUMMARY.md),
[verification map](spec/src/verification.md), [component catalog](catalog/components/README.md)
and [third-party notices](THIRD_PARTY.md). Work is delivered in reviewed slices.

## License

[AGPL-3.0-or-later](LICENSE.md).
