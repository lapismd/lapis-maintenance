# GitHub and token sessions

## LM-SESSION-001 — Remembered token login

**Requirement.** The host MUST own one token session, show login without a valid remembered token and render the authenticated GitHub identity and avatar.

### Acceptance details

- Token entry uses a password control; remembering is explicit in the form, credentials stay in a dedicated device-local session record and never enter controller snapshots, Storybook args, URLs, logs or the Turso data cache.
- Restoring authenticates the token before exposing cached repository data; invalid tokens clear the session and return to login; transient errors offer retry without leaking prior-session data.
- Disconnect aborts pending work, disposes the controller/cache, clears the remembered token and active cached data, and returns to login; changing tokens switches the cache partition.
- The sidebar shows the authenticated user's name/avatar and session copy describes confirmed PR/CI actions with their token permissions; fixtures supply synthetic identities/disposable ports, while the manual local-only live-session story reuses the production host without credential args.

## LM-GH-001 — Authenticated repository reads

**Requirement.** Slice 2 MUST use direct browser GitHub reads with one user-supplied token; only separately authorized commands may write.

### Acceptance details

- Discover defaults from dependency-automation's allowlist and show repositories while activity loads; icon-only repository settings expose icon/checkbox rows for defaults, retain explicit additions/exclusions and holds, and keep one coverage row per repository.
- Read open PRs, current-head checks/statuses/reviews, workflow attempts and environment waits; closed-PR runs cannot become missing-branch warnings, omitted run associations may link only unique open matching heads, and real coverage failures identify the run, branch and error while draft/running/cancelled/held/unavailable remain distinct.
- Manual and five-minute visible refresh use bounded concurrency, pagination, conditional requests, cache freshness and rate-limit backoff; partial coverage is explicit, stale responses cannot cross sessions, and the default transport preserves the native browser fetch receiver.
- Mounting, navigation, filtering, details and refresh perform reads only; authorized Slice 3 PR/CI capabilities follow the write contract, while release actions remain visibly unavailable pending Slice 4 approval.
