# GitHub and token sessions

## LM-SESSION-001 — Remembered token login

**Requirement.** The host MUST own one token session, show login without a valid remembered token and render the authenticated GitHub identity and avatar.

### Acceptance details

- Token entry uses a password control; remembering is explicit in the form, credentials stay in a dedicated device-local session record and never enter controller snapshots, Storybook args, URLs, logs or the Turso data cache.
- Offline startup shows reconnect without reading a token or exposing account data; online restoration may use the saved verified identity to open the same token partition and display cached cards read-only while authentication runs; legacy token-only records authenticate once before saving this bootstrap identity; invalid tokens clear the session and return to login; transient errors offer retry without leaking prior-session data.
- Disconnect aborts pending work, disposes the controller/cache, clears the remembered token and active cached data, and returns to login; identity-only metadata updates preserve other tabs while changing tokens switches the cache partition and persistent fallback storage remains visibly identified.
- The sidebar shows the authenticated user's name/avatar and session copy describes confirmed PR/CI/release actions with their token permissions; fixtures supply synthetic identities/disposable ports, while the manual local-only live-session story reuses the production host without credential args.

## LM-GH-001 — Authenticated repository reads

**Requirement.** Slice 2 MUST use direct browser GitHub reads with one user-supplied token; only separately authorized commands may write.

### Acceptance details

- Discover defaults from dependency-automation's allowlist and show repositories while activity loads; icon-only repository settings expose icon/checkbox rows for defaults, retain explicit additions/exclusions and holds, and keep one coverage row per repository.
- Batch bounded read-only GraphQL PR summaries with scoped REST fallback for denied, partial or truncated results; read current-head checks/statuses/reviews, workflow attempts and environment waits; closed-PR runs cannot become missing-branch warnings, omitted run associations may link only unique open matching heads, and real coverage failures identify the run, branch and error while draft/running/cancelled/held/unavailable remain distinct.
- Valid cached boards publish before allowlist discovery and remain visible while repository activity revalidates; manual and five-minute visible refresh retain bounded concurrency, pagination, conditional requests and rate-limit backoff; selected details and validation take queue priority over background inventory, scoped refreshes invalidate affected derived/entity data without scanning unrelated repositories, and the native browser fetch receiver/session boundaries remain intact, with independent cancellation for shared readers.
- Mounting, navigation, filtering, details and refresh perform reads only; authorized PR/CI/environment commands use fresh identified authority, public-fork approval provenance and concrete permission feedback, while checks/workflows/jobs retain target links; selected-detail ports publish matching retained previews synchronously before storage and use persistent freshness for revalidation, inventory restoration preserves presentation caches, and permission denial invalidates retained repository details.
