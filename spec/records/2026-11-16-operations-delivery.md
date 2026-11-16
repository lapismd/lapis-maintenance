# Repository Actions and Operations delivery

Owner: LM-GH-003, LM-GH-004, LM-OPS-001, LM-ACT-003, LM-UI-004 and LM-HOST-001.
This receipt closes the hosted and designated-action gates recorded in
`2026-11-15-repository-actions-operations.md` and `2026-11-15-operator.md`.

## Checked source and Pages

[PR #9](https://github.com/lapismd/lapis-maintenance/pull/9) merged checked head
`4adbc2fa542b435075adb0d605cf14d5c67b1e6c` as
`51fae11af48a5cec4da81bbc517bd9bfcdd56956`; their trees are equal.
[PR CI](https://github.com/lapismd/lapis-maintenance/actions/runs/43787721311)
passed before merge. Both check and deploy jobs passed in
[merged-main CI and Pages](https://github.com/lapismd/lapis-maintenance/actions/runs/43788149237).

The final registry dependency graph passed 225 unit tests, 20 browser cases,
210 Storybook interaction/accessibility cases and seven production PWA cases,
plus type, format, architecture, specification and production/static builds.
Source publication and npm artifact/provenance verification are recorded in the
presentation receipt. No temporary archive or local link is delivered.

## Hosted acceptance

The public app matches the exact `github-pages` artifact from run `43788149237`
for index, worker, manifest, both app icons and every JS/CSS entry referenced by
index: 17 files matched. Artifact `14190783480` belongs to the merged main SHA;
its reported archive digest is
`sha256:4115962627df614799009178164f11402eefc635687e4e94c707b9f8ec6db7a5`.

Fresh Chromium acceptance confirms cross-origin isolation, no installability
errors, 236 public cached assets, offline cold reload, online reconnect and zero
anonymous/offline GitHub requests. CacheStorage excludes GitHub API responses,
credentials, query URLs and Storybook. Published Storybook excludes the local
live-session story. The populated published Operations workspace visibly renders
the released joined Operation/Policy buttons; expanded report evidence uses
Report/Policy labels. Visuals remain pending without baseline comparisons.

The production read adapter also loaded current coordinator evidence at immutable
source `d4b1d77eab037c925f49dd5c579d8edabe135f7f`, reporting 19 public nodes and
zero coverage gaps. This is an observed report, not a grant of command authority.

## Designated real batch acceptance

Production `MaintenanceCommands`, `GithubCommandPort`, dispatch and read adapters
were loaded through Vite SSR. The existing CLI credential stayed in process and
was neither printed nor persisted. The write transport was additionally restricted
to workflow `418655275` and the two runs uniquely identified by acceptance markers.
No workflow definition, repository permission or environment protection changed.

Both runs targeted checked main `51fae11a`, workflow definition
`e62710c2ce0a8436c922375a2a396c2cae93ad1a`, and the existing disposable
`maintenance-acceptance-20261114` environment. The workflow has no checkout,
repository permissions, secret use or publication steps.

| Run                                                                                             | Accepted operations                                                                      | Final outcome       |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------- |
| [43789338872](https://github.com/lapismd/lapis-maintenance/actions/runs/43789338872/attempts/2) | Dispatch; reject attempt 1; batch rerun failed jobs; batch approve attempt 2 environment | Attempt 2 succeeded |
| [43789353395](https://github.com/lapismd/lapis-maintenance/actions/runs/43789353395/attempts/2) | Dispatch; reject attempt 1; batch rerun failed jobs; batch approve attempt 2 environment | Attempt 2 succeeded |

All eight writes were accepted through fresh per-target preflight. Each batch
retained two distinct accepted receipts and executed on activation without a
confirmation dialog. Accepted submission was recorded separately from final run
success. Both first attempts failed by intentional environment rejection, leaving
auditable evidence before the successful reruns. No uncertain write was replayed.
Partial rejection, uncertainty, disposal, duplicate prevention and changed later
targets retain automated regression coverage. Eligible public-fork approval remains
mock/manual coverage; these runs do not manufacture that GitHub state.

The final receipt/tracker-only follow-up runs formatting and canonical specification
checks locally and the normal complete hosted CI/Pages gate before handoff.
