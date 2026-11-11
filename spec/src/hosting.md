# Hosting and offline behavior

## LM-HOST-001 — Static Pages PWA

**Requirement.** The application MUST be installable as a static GitHub Pages PWA under
/lapis-maintenance/, with fixture-only Storybook under /lapis-maintenance/storybook/.

### Acceptance details

- Hash navigation, manifest identity/start URL/scope, icons and assets respect the Pages base; supported browsers offer installation, and documented browser installation covers other platforms.
- One worker supplies isolation headers and caches only the versioned public app asset inventory; authenticated requests, credentials, repository data, unknown URLs and Storybook never enter CacheStorage, and offline startup shows a reconnect shell without authentication or cached account data.
- Bound isolation bootstrap reloads, migrate the former isolation worker, and keep updates waiting for explicit reload without interrupting forms or commands; preserve older clients, prune obsolete asset versions once they are no longer needed, and cache only the app's own assets.
- Pinned CI verifies installation metadata, subpaths, hash/reload, offline/cache boundaries, migration and deferred updates before publishing checked main output; closed-app monitoring, bulk writes and a hosted service remain deferred.
