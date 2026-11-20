# Controller and ports

## LM-CTRL-001 — Host-owned controller and injected ports

**Requirement.** MaintenanceController MUST own presentation state and accept replaceable typed read
and command ports; the host owns construction and disposal.

Repository discovery policy under LM-GH-003 affects read coverage only; adding a monitored repository cannot prepare a command, remove a consumer hold or bypass the command adapter's fresh authority checks.

Cache retirement drains owned writes before releasing its logical partition, preserving cached responses across rapid remounts under LM-CACHE-001.

The attention policy under LM-CACHE-001 preserves unverified rows on partial
inventories and retires resolved identities across saved selections only with
complete PR or workflow evidence; those domains establish completeness separately
from optional-resource gaps, and maintenance timers retire with their owning
cache while the shared backend closes only after its last logical partition.

PR descriptions remain raw Markdown in cached resources. Presentation alone
renders them under LM-PR-001 without extra reads or changes to command authority.

Normalized check details retain optional provider start and completion times for
LM-PR-001 presentation. Missing or invalid times remain absent, never affect
check state, eligibility or command authority, and do not introduce a timer into
the controller or persistent cache lifecycle.

Branch-action filters are host-owned presentation state under LM-UI-004. They intersect explicit repository selection across views, preserve selection when matches disappear, and never issue commands. Header summary counts derive from those same visible items, including query, card-status and view filters, without extra provider reads.

Session-owned feedback is disposable and bounded; shared request IDs deduplicate
action outcomes across board, inspector and review surfaces. Background refresh
failures re-arm after recovery without replaying actions, and no notification is
persisted in account caches.

Application build identity is static public presentation metadata under
LM-UI-001, independent of repository/card revisions and command authority. Its
short commit label links to the full application source commit.

### Acceptance details

- Reads supply snapshots/details with PR identity and workflow Actions links; commands bind to a PR SHA, run attempt or deployment identity, with check completeness independent of unrelated resource gaps and return completed, accepted, rejected or uncertain; the selected card remains available for immediate inspector presentation while ports load full cached details; subsequent cached progress replaces that summary and preserves disabled actions until the detail read settles.
- Kanban board/activity navigation, mount, selection, filters and refresh never write; virtualized lanes retain snapshots, counts and selected details; header/footer layout changes local state only; activity uses each item's latest update with shared filters; column-link copy uses current filtered item URLs without reads, commands or cache writes; merge selection never submits; action/input activation captures its immutable target and selected method once while pending, with one preflight and disposal cancellation.
- Refresh/detail races and disposal reject stale responses, including cached progress, while progressive snapshots update independently during initial and background refresh; detail refresh/failure retains matching cached content with explicit feedback, affected-repository updates preserve unrelated items, and changed command targets require refresh and renewed activation; input drafts survive rejection and uncertain outcomes block resubmission.
- Credentials stay outside snapshots/args/preferences and data caches; hosts own remembered sessions, bounded worker bootstrap and cache lifetime, read-only restore preserves controller filters and rejects commands before authentication, production never imports fixtures, uncertain writes are not replayed, and review/activity controllers label effects and own independent resources, cursor paging, race/disposal guards and retained data under LM-PR-001, LM-PR-002 and LM-FEED-001, with live ports constructed and retired by the authenticated host.

## LM-OPS-001 — Operator wave state

**Requirement.** The operator view MUST explain dependency/release progress, decision reasons, policy revisions and immutable source/operation targets, while retaining ordinary controls when reports are unavailable.

Automation decisions show one current row per repository, selected by observation
time rather than report-array order, with at most one previous distinct decision
in that row's expanded details; timestamp ties prefer the later report entry,
repository identity ignores case, and search/repository filters apply after
selection so obsolete decisions cannot reappear as current results.
Host-owned coordinator presentation retains only these two decisions per
repository while the immutable source report remains the complete audit record;
header counts reflect current repository rows, and opening comparison details
never issues a command or fetches history. Decision timestamps retain a small
bottom margin before identifier controls, and both observations use public Design
Core RelativeTime with exact dates available on hover or keyboard focus.

LM-OPS-001 scoped SDK observations MUST distinguish the selected tooling status
from deferred repository work, retain typed holds and upstream waits, and expose
all three immutable grant/policy/descriptor coordinates without granting command
authority. Deferred work participates in search and attention while legacy
expected-progress rules and independently preflighted manual commands remain
unchanged; zero selected SDK updates cannot imply a fully updated repository.

Validated structured attention selects the highest-priority concrete compact-row
reason, displays its category and expands to remediation with safe public links.
Legacy reports fall back to their first concrete hold; report remediation remains
presentation only and cannot prepare or authorize a command.

### Acceptance details

- Host-owned report resources warm in the background after session startup and load on demand without blocking cached board startup, reuse persisted response resources, retain prior evidence during refresh and reject stale/disposed reads.
- Distinguish running work, upstream/publication/qualification waits, approval waits, compatibility decisions, manual repair ownership, publication failures, discovered updates, admitted candidates, scoped branch holds and opaque coverage gaps while ordinary manual controls remain independent of coordinator evidence.
- Design Core ScrollArea contains borderless timeline sections with opaque collapsible sticky headers flush beneath the app toolbar with empty sections closed initially, an icon-only fold/expand-all control covers sections and details, compact rows start collapsed and reveal details on activation, source commits and repositories link to GitHub with padded neutral hover, and paired operation/report and policy digests use the public joined identifier control with custom labels and independent exact-value copying while integrity retains its single copy control.
- The existing Operations navigation and single-row Inbox summary show filter-scoped actionable-node and open-issue counts excluding expected progress; the Inbox row aligns with the header controls, links to Operations and has no expandable report details, while batch actions remain in a fixed page footer outside the scrolling report with icons, bounded outcomes and no heading or description, preserving narrow-layout access without overlap.
