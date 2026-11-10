# Foundation evidence — 2026-11-10

The complete PLAN and eight canonical requirements precede all product code.
Node 24.15.0, pnpm 10.34.5; npm Design Core 0.12.3 and spec-validator 0.2.0.

- `pnpm exec spec-validator doctor --json`: all eleven probes pass, including
  QMD binary/native health and exact script aliases.
- `pnpm spec:search --semantic "controller"`: successful QMD-backed results
  for the owning controller chapter and related requirements.
- `pnpm check`: formatting and foundation configuration types pass.
- `pnpm spec:validate`: six validators, nine chapters, eight requirements pass.
- `pnpm spec:build`: mdBook build passes.
- `pnpm spec:check`: validate, mdBook and specification-first all pass.
- `actionlint .github/workflows/check.yml`: no diagnostics.

Initial attempts found canonical statement/acceptance formatting, unsupported
verification statuses, missing explicit QMD SQLite ignore and duplicate Markdown
subheadings. The authored spec now follows the validator's atomic single-line
acceptance format and declares Planned/Pending statuses without claiming future
implementation. The standard Markdown sibling-heading rule permits one
Acceptance details heading per requirement.

The initial config had QMD disabled and used the documented fallback; after
wiring its tracked collection, native doctor and semantic QMD search pass.
`pnpm doctor` invokes pnpm's built-in command: use `pnpm run doctor` or the exact
spec-validator command above. This CLI does not accept an extra `--` separator
for search; the README uses its supported arguments.

Product tests, interactions and static Storybook acceptance are pending Slice 1.
No browser, token, live GitHub action, deployment, or PWA is qualified here.
