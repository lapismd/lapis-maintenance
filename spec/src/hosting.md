# Hosting and offline behavior

## LM-HOST-001 — Static Pages PWA

**Requirement.** The user-authorized Pages delivery MUST host the app under /lapis-maintenance/ and fixture-only
Storybook under /lapis-maintenance/storybook/ as static GitHub Pages output.

### Acceptance details

- Hash navigation and all assets, manifest and worker scope respect the base.
- The offline worker caches only versioned app assets, excluding authenticated requests, credentials, the separate Turso database and Storybook; offline opens the shell with reconnect state, while Slice 2's isolation bootstrap adds headers without response caching.
- Verify installation, reload and subpaths; Closed-app monitoring, bulk writes and a hosted service remain deferred.
- Deploy only checked main output through pinned Pages Actions, combining app assets and fixture-only Storybook; the current publication authorizes hosting while installation/offline acceptance remains a later PWA slice.
