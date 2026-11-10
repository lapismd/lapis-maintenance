# Hosting and offline behavior

## LM-HOST-001 — Static Pages PWA

**Requirement.** Planned Slice 5 MUST host the app under /lapis-maintenance/ and fixture-only
Storybook under /lapis-maintenance/storybook/ as static GitHub Pages output.

### Acceptance details

- Hash navigation and all assets, manifest and worker scope respect the base.
- Cache only versioned app assets, excluding authenticated requests, credentials, repository data and Storybook; offline opens the shell with reconnect state.
- Verify installation, reload and subpaths; Closed-app monitoring, bulk writes and a hosted service remain deferred.
