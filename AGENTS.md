# Lapis Maintenance agent guide

Read this guide and the owning canonical requirement in `spec/src` before code.
Apply the parent workspace guidance. This repository owns the maintenance UI,
controller, adapters, and hosting configuration; shared component fixes belong
to their owning Design Core or Agent/Repository UI package.

- `PLAN.md` records the complete approved plan and slice gates. Implement only
  the current authorized slice. Slice 1 is approved. Slice 2 authorizes token
  login, remembered local credentials, live read-only GitHub adapters and a
  token-partitioned Turso WASM cache. The user subsequently authorized Slice 3
  PR/CI writes through the live app/story; stop before Slice 4 release actions.
  The user also explicitly authorized publishing required dependencies, pushing
  the completed changes and deploying the live app to GitHub Pages. The user authorized Slice 5 PWA installation/offline work on 2026-11-11;
  Slice 4 release actions remain unapproved.
- Search with `pnpm spec:search --semantic "topic"` before reading specs;
  use the CLI's executed rg fallback only when QMD is unavailable.
- Update the owning requirement and verification evidence with protected code.
  Future requirements stay planned until implemented and verified.
- Use public Design Core AppShell and controls, native CSS and public tokens.
  Keep host credentials, effects, and controller lifetime outside presentation.
- Production code cannot import catalog fixtures. Mounting and reads never
  write. Commands require explicit confirmation and immutable target identity.
- No real token, GitHub transport, backend, bot, deployment or PWA in Slice 1.
  Published Storybook and automated story runs remain fixture-only. The user
  authorized a local-development live-session story that mounts the production
  app for manual token acceptance; it has no token args or automated play.
  Live transport belongs in
  src/github, persistence in src/cache and src/session; credentials never enter
  controller state or the data cache. The app worker caches public versioned assets only; private data remains in Turso.
- Keep new production files within 300 counted lines, stories within 400 and
  tests within 500. Split by responsibility.
- Run exact changed tests first, then all repository check, test, Storybook
  interaction/accessibility, static build, and spec lanes. Keep failures in
  evidence. Do not compare screenshots or update visual baselines.
- Use Jujutsu; preserve unrelated work and commit verified slices unsigned.
  Never commit secrets or local loader/editor configuration.
