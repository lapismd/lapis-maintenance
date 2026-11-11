# Governance

## LM-GOV-001 — Specification and reviewed delivery

**Requirement.** Canonical requirements and the complete plan MUST precede implementation, with an
explicit user approval boundary after each verified slice.

### Acceptance details

- Each requirement has one verification row; future behavior remains planned.
- Spec-validator validates navigation, governance, verification, QMD wiring, Markdown, book output and mapped specification-first changes.
- Tools and CI Actions are pinned; dependencies and lockfiles resolve npm, with published Design Core ^0.12.4 retaining read-only Kanban activation and Repository UI ^0.2.0 supplying shared forge panels/checks, verified through frozen registry acceptance without local archives, package patches or source aliases in the delivered app.
- CI exercises functional gates, app/fixture-only static builds, real browser storage, production PWA installation/offline/update tests and a fail-closed boundary audit, with credentials/transport/cache in their owning modules; the local manual live-session story is excluded from published and automated discovery, without screenshot comparisons.
