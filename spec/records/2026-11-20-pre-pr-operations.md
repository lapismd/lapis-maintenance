# Pre-PR Operations state and owner actions

Owners: LM-UI-001, LM-OPS-001 and LM-ACT-003.

## Observed defect

Generation 436 showed green current-main GitHub state and no open pull request
for Desktop, Notes, Plugins, Tasks, Docs, Notebook and Plugin Registry while the
Operations timeline still presented coordinator `held`, `uncertain` and
`upstream-wait` values as if they were live queued work. In particular, a
downstream publication wait opened that downstream repository's workflow picker
even when the structured attention record named a different upstream owner.

The four Notes packages were independently verified after npm promotion as
API `0.6.11`, App Profile/UI `0.2.8` and Workspace `0.4.10`, each on `latest`
with no remaining `next` tag. A fresh coordinator replay owns settlement of
those publication facts; the UI does not infer settlement from npm on its own.

## Contract

Complete live pull-request coverage plus the absence of a current workflow or
PR item now projects unresolved coordinator evidence as `blocked-before-pr`.
Product, rollout and explicit policy constraints project as
`automation-inactive`. Both retain the exact coordinator details and the
independent GitHub badge, while the row summary begins `No PR`.

Publication and qualification workflow discovery now targets the repository on
the primary structured attention item. Channel and publisher-policy waits link
their exact coordinator configuration instead of offering an ineffective
workflow rerun. Product constraints link the newest known owning issue, falling
back to the repository's open-issue list. All dispatches still require normal
workflow/ref/input discovery and fresh preflight; report text grants no write.

## Verification

- Focused current-state unit coverage passes 8/8, including no-PR blocked and
  inactive projection plus live-work precedence.
- Focused browser coverage passes 6/6, exercises the upstream-owner dispatcher
  target and keeps the existing coordinator recovery action.
- Repository-wide unit coverage passes 288/288, browser coverage passes 45/45,
  Storybook interaction/accessibility coverage passes 232/232 and PWA coverage
  passes 7/7. Formatting, architecture/type checks, application and Storybook
  builds, specification validation/build/spec-first, doctor and semantic search
  also pass. Hosted exact-main evidence is recorded in the delivery pull request
  before merge.
- No visual baseline is changed.
