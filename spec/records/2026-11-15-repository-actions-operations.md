# Repository Actions and Operations presentation

Default-branch Actions summaries reuse current-head workflow inventory and cached
responses. They summarize the latest attempt per workflow at the current branch
SHA, exclude PR-triggered runs, and distinguish passed, failed, pending and unknown
without treating missing or incomplete results as success. Existing cached views
retain their summaries during refresh; legacy cache rows derive them from cached
inventory rather than creating an extra badge-specific GitHub request.

Repository rows and the shared Command View display accessible icon-only status
badges aligned to the right. The multi-select status filter intersects repository
selection across the board, Activity and Operations. An explicitly restricted empty
activity scope never falls back to all repositories. Hash navigation retains the
filter, and Clear resets it. The dispatch repository field now uses a searchable
keyboard-accessible Command View; selecting an option performs no dispatch.

The existing Operations page and Inbox attention surface compose local shared
borderless timeline sections, status chips, disclosures and GitHub source links. Release/downstream/
decision sections use compact connected timelines without inventing timestamps.
Following review, Activity and Linear updates inform the row hierarchy: names,
short muted summaries and state chips; rows start collapsed and reveal full
metadata only when activated. Opaque sticky headers are flush below the toolbar,
with parent and scroll-container insets removed for Operations. Batch actions
occupy a fixed page footer outside the scroller without descriptive text.
References: https://linear.app/docs/initiative-and-project-updates and
https://vercel.com/docs/deployments/managing-deployments. Actual
Git source hashes link to their owning commits; policy/report/integrity hashes
remain identifiers. Advanced targets and report metadata remain available in
collapsed disclosures. Batch labels, eligibility, immediate actions and per-target
receipts are preserved. The existing Operations navigation item counts actionable
nodes and open issues; ordinary running work and expected waits do not count.
Session startup warms coordinator evidence independently alongside board refresh;
persisted resource responses remain reusable across reloads and manual report
refresh remains explicit. No automated validation uses real tokens or writes.

## Regression ledger

Repository baseline: 23 unit tests and five stories passed. New branch summarizer
and inventory regressions first failed, then passed 11 tests; filtered activity
scope regressions first failed twice, then passed 15 focused tests. The complete
unit lane at that point passed 222 tests. Search plus status filtering exposed
stale Command View options; external name/status filtering through the public
shouldFilter API repaired that regression, with all three picker stories passing.

Operations stories before the presentation change had two failures and nine
passes, covering absent commit links/timeline and the attention disclosure.
Attention scope initially failed collection because its new module was absent;
after implementation the focused unit lane passed nine tests. Final required
validation and hosted delivery receipts are recorded after execution.

Visual review remains visual-pending; no screenshot baselines are compared or
updated. Storybook demonstrates fixture-only data in full-shell, narrow, dark,
missing/stale/unsupported evidence and immediate-batch scenarios.

## Review follow-up

The final timeline uses public shadcn ScrollArea, with its own labelled viewport,
opaque full-width sticky section headers, expandable compact rows, and empty
sections initially closed. Geometry coverage checks headers flush to the toolbar,
row/heading icon centres and indented empty content. Report evidence uses one
compact metadata disclosure; there is one toolbar refresh and the footer contains
only actions and bounded receipts. Expanded properties separate qualification,
ownership, dependency waits, package version changes and provenance. Long IDs
use the public joined RepositoryIdentifiers control with Operation/Policy or
Report/Policy chip labels and independent copying; actual source
commits keep GitHub links. The repository status menu uses compact checkbox icons,
row spacing and a centred toolbar trigger.

Review regression results: the footer geometry, distinct status colours and
light/dark contrast checks first exposed four failures, including a nested footer
landmark; semantic regions and contrast-safe theme mixtures repaired them. Sticky
geometry caught the old scroll padding gap, which was removed from the owned
Operations parent and viewport. Alignment initially failed, then identified a
remaining one-pixel button border inset; the final focused presentation lane
passes 27 scenarios. A stylesheet split exposed an implicit common-style import;
shared content, timeline, evidence and attention styles now have explicit owners.
The compact properties revision caught duplicated landmark labels, which were
removed from private detail sections. Empty-section assertions verify visibility
because the public disclosure may retain hidden DOM during its lifecycle.

The coordinator refresh regression reproduced three reads instead of two after
one manual refresh; the controller now selects one report refresh path, preserving
background session warmup and independent resource-cache reuse.

The reviewed fold/expand-all icon coordinates section, row and report disclosures without reads or writes; local choices persist until the next all-toggle activation. The attention badge now uses a subtle neutral tint, and the ScrollArea reserves an eight-pixel right gutter. A compile regression from the initial all-toggle binding was repaired; its exact story now passes, and the restarted populated shell renders successfully.

Joined identifier integration first reproduced one missing-pair story failure.
The shared Repository UI source now supports custom paired labels; temporary
public archive validation is documented under ignored `.local/identifier-preview.json`
and was replaced by the released registry range before commit/deployment.
The paired-identifier, fold-all and evidence targets pass three stories; initial
follow-up failures exposed two obsolete accessible-name queries, which now use
the shared component's actual copy labels. Full maintenance unit validation
passes 225 tests; type, architecture and specification checks pass.

The first integrated browser run had one failure and 19 passes: remembered-session
acceptance sampled report readiness before background warming began. The session
now starts independent report warming alongside board loading, never awaiting it,
and remount acceptance waits for the authenticated refresh control before checking
the unchanged zero-extra-provider-request assertion. The narrow warming-order
regression first failed once before the startup ordering repair.

Final public-archive qualification passes all 225 unit tests, 20 browser cases,
seven PWA cases and 210 Storybook interaction/accessibility cases. Production and
static Storybook builds, type/format/architecture, doctor, QMD semantic search and
canonical spec checks pass. The shared identifier extension and isolated-worker
bootstrap repair are tracked in https://github.com/lapismd/agent-ui/pull/38.

Source PRs #38 and #39 passed all seven hosted lanes and merged with checked-head
trees equal to their merge trees. Exact release main
`48435a193aadb906006800f36858fd33d8e278de` passed CI before immutable tag `v0.2.8`.
Publisher run https://github.com/lapismd/agent-ui/actions/runs/43786568782 verified
the exact registry bytes, provenance and a clean signed install for Agent UI 0.2.8
and Repository UI 0.2.6. Maintenance now uses registry floors `^0.13.4` for Design
Core and `^0.2.6` for Repository UI, with a frozen install and no archive/link
dependencies.

Final registry consumer qualification passes 27 focused stories, all 225 unit
tests, 20 browser cases, seven PWA cases and 210 Storybook interaction/accessibility
cases, plus production/static builds and type/format/architecture/spec checks.
The installed package and lockfile match the verified registry integrity. A cold
populated Storybook process renders the joined Operation/Policy control from the
released public package. Exact-head hosted CI and merged-main Pages/PWA remain
separate delivery gates, with their durable receipts on the delivery PR and
GitHub Actions run.
