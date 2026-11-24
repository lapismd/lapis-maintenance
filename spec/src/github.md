# GitHub and token sessions

## LM-SESSION-001 — Remembered token login

**Requirement.** The host MUST own one token session, show login without a valid remembered token and render the authenticated GitHub identity and avatar.

Repository branch-action summaries reuse the default-branch head and paginated workflow inventory. Aggregate the latest push-event attempt per workflow only at that head and branch; scheduled, manual, chained, dynamic and pull-request runs remain operational evidence without poisoning current push qualification. Failed outranks pending, incomplete or absent results stay unknown, and unrelated PR/issue failures do not erase verified branch status. No badge-specific requests are introduced.

### Acceptance details

- Token entry uses a password control; remembering is explicit in the form, credentials stay in a dedicated device-local session record and never enter controller snapshots, Storybook args, URLs, logs or the IndexedDB response cache.
- Offline startup shows reconnect without reading a token or exposing account data; online restoration may use the saved verified identity to open the same token partition and display cached cards read-only while authentication runs; legacy token-only records authenticate once before saving this bootstrap identity; invalid tokens clear the session and return to login; transient errors offer retry without leaking prior-session data.
- Disconnect aborts pending work, disposes inventory/review/activity/dispatch controllers and drains owned transport/resource persistence before clearing and closing the token partition; it disposes the controller/cache, clears the remembered token and active cached data, and returns to login; identity-only metadata updates preserve other tabs while changing tokens switches the cache partition and persistent fallback storage remains visibly identified.
- The sidebar shows the authenticated user's name/avatar and session copy describes explicitly activated PR/CI/release actions with Pull requests/Contents/Actions/Deployments permissions and environment reviewer eligibility; fixtures supply synthetic identities/disposable ports, while the manual local-only live-session story reuses the production host without credential args.

## LM-GH-001 — Authenticated repository reads

**Requirement.** Slice 2 MUST use direct browser GitHub reads with one user-supplied token; only separately authorized commands may write.

Live cards and persisted snapshots are an attention queue under LM-CACHE-001; resolved workflow history is omitted while compact branch health and passing open PRs remain. PR/workflow inventory completeness is independent of optional-resource errors and controls retirement; partial coverage preserves unverified attention rows.

Detailed check-run and workflow-job reads preserve GitHub's optional start and
completion timestamps in the normalized check contract so LM-PR-001 can display
elapsed or final durations. Commit statuses without reliable execution bounds do
not synthesize timing.

### Acceptance details

- Discover defaults from dependency-automation's allowlist and show repositories while activity loads; icon-only repository settings expose icon/checkbox rows for defaults, retain explicit additions/exclusions and holds, and keep one coverage row per repository.
- Batch bounded read-only GraphQL PR summaries with scoped REST fallback; read current-head checks/statuses/reviews, workflow attempts and environment waits, inspecting discovered `waiting` and `pending` runs for protected-environment approvals without a repository-wide pending query; prevent closed-PR missing-branch warnings, keep merge-queue runs on resolved default-branch SHAs, link omitted associations only to unique open heads, and identify coverage failures with contextual errors.
- Valid cached boards publish before allowlist discovery and remain visible while repository activity revalidates; manual and five-minute visible refresh retain bounded concurrency, pagination, conditional requests and rate-limit backoff; selected details and validation take queue priority over background inventory, scoped refreshes invalidate affected derived/entity data without scanning unrelated repositories, and the native browser fetch receiver/session boundaries remain intact, with independent cancellation for shared readers.
- Cached targets restore identity only and command preflights supply fresh authority; the live shell owns lazy timelines, dispatch and independent PR resources; explicitly activated actions use current identity and permission feedback; repository auto-merge settings and PR scheduling state reuse existing reads; navigation/filtering/refresh stay read-only, check/job links and optional provider timestamps retain their targets/evidence, workflow fallbacks open Actions, previews precede storage, fresh persistent resources avoid provider reads, inventory restore preserves presentation caches, and denial invalidates retained details.

## LM-GH-003 — Shared monitoring policy

**Requirement.** Repository discovery MUST combine the coordinator's monitoring-only repositories with dependency-update defaults without treating monitoring membership as write authority.

### Acceptance details

- Monitoring exclusions remove default entries, duplicate monitoring entries preserve existing consumer holds, and legacy configurations without monitoring remain supported.
- Explicit operator additions/exclusions retain their existing precedence; legitimate dot-prefixed repository names such as `lapismd/.github` are accepted, while path traversal and URL injection are rejected.
- Malformed monitoring policy produces an explicit discovery coverage gap; the coordinator and explicit valid additions remain inspectable without silently using partial defaults.

## LM-GH-004 — Coordinator evidence and open issues

**Requirement.** The authenticated read adapter MUST expose open GitHub issues and version 1 public coordinator reports without granting command authority.

Validate the complete immutable source report before producing a host-owned
latest-and-previous decision projection under LM-OPS-001; require parseable
decision observation times no later than the report's observation tolerance,
preserve the original report/source/policy identities, and retain the full audit
history only at its authoritative source rather than in raw browser response
caches under LM-CACHE-001.

Scoped SDK report data is optional and strictly validated before exposure under
LM-GH-004; unknown kinds, malformed/bounded source facts, digest or selected/deferred
identity drift make evidence explicitly unavailable without disabling manual
GitHub controls. Existing report-age, future-time and current-policy checks also
apply to scoped observations; displayed hashes are evidence coordinates rather
than client-side permission or grant verification.

Optional structured attention is likewise bounded and reject-by-default before
presentation. Categories, text and public repository/commit/branch/package/path
coordinates are validated without accepting arbitrary URLs or action descriptors;
the immutable holds, waits, qualification and ownership fields remain authority.

### Acceptance details

- Read open issues with pagination, omit pull requests, preserve issue links and report denied/incomplete issue coverage explicitly.
- Lazily read `report.json` from coordinator branch `automation/dependency-wave-state` independently of cached inbox startup, resolving the branch before reading bytes at its immutable source commit.
- Unsupported, missing, malformed, older-than-24-hour, future-dated and policy-revision-mismatched reports remain explicit and never authorize writes.
- Expose only the versioned public report contract, keep private coverage opaque and preserve browser credentials within the existing session transport without forwarding them to coordinator Actions.

## LM-GH-005 — Read-only AutoCraft queue evidence

**Requirement.** The authenticated host MUST lazily read the private AutoCraft operations report as bounded presentation evidence without granting command authority.

### Acceptance details

- Resolve the private report branch to immutable bytes through the existing user-token transport, retain report/worker source identities separately, compare the worker source to current main and match the SHA-256 digest of its operations policy.
- Validate schema, kind, exact PR/workflow URLs, immutable heads, typed receipt identities/outcomes/times, duplicate targets, coverage and field bounds within 512 KiB; discard unknown fields before caching.
- Label reports older than thirty minutes, future-dated by over one minute or policy-mismatched as stale; missing, denied, unsupported or unverifiable evidence remains explicit without granting command authority or disabling manual controls.
- Keep raw bytes out of response persistence, age-check token-partitioned validated projections and cancel/fence superseded or disconnected requests independently of coordinator loading and cached inbox startup.
