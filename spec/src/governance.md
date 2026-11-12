# Governance

## LM-GOV-001 — Specification and reviewed delivery

**Requirement.** Canonical requirements and the complete plan MUST precede implementation, with an
explicit user approval boundary after each verified slice.

### Acceptance details

- Each requirement has one verification row; future behavior remains planned.
- Spec-validator validates navigation, governance, verification, QMD wiring, Markdown, book output and mapped specification-first changes.
- Tools and CI Actions are pinned; dependencies and lockfiles resolve npm, with published Design Core ^0.13.1 retaining read-only activation and measured long Kanban lanes and Repository UI ^0.2.2 sharing one Core runtime for forge panels and bounded checks, verified through frozen registry acceptance without local archives, package patches or source aliases in the delivered app.
- CI exercises functional gates, app/fixture-only static builds, real browser storage, production PWA installation/offline/update tests and a fail-closed boundary audit, with credentials/transport/cache in their owning modules, including an explicit IndexedDB data-cache boundary; the local manual live-session story is excluded from published and automated discovery, without screenshot comparisons.
