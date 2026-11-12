# Long Activity lane rendering — 2026-11-13

The wide-browser paint failure correlates with the long Activity lane: collapsing
that lane restores rendering while the DOM and bounded scroll geometry remain
intact. The browser/graphics root cause is unconfirmed. Temporary blur, hover
and containment probes were removed; this change bounds the mounted workload
through the owning Design Core renderer.

## Source ownership

Design Core PR #76 (`292c0e1e01b91bfc14d966b461cb3062279d0214`) adds measured
viewport rendering above 40 cards, with overscan and retained selection, focus
and dragging, stable identities and refresh anchoring. Source regression first
failed with all 300 cards mounted; after the repair, the exact and full Kanban
stories, pointer coverage and all required source lanes pass. A clean packed
consumer validates CSS, controls, themes and lifecycle with zero audit findings.
The source record retains interrupted runs and the passing exact retries.

The source fix merged as 1fa32864 and version PR #77 merged as 329cc67a.
Fresh main CI 43527753030 and release run 43527753783 passed; the first registry
verification attempt timed out on metadata visibility, then the unchanged
verification passed on retry. The published Core 0.13.1 tarball matches the
verified artifact, SHA-256 f7509a5e2825cca8b4823eba54d3e7f43b80bbc26eb710da113ca7669a52c686.

Repository UI 0.2.2 supplies Core ^0.13.0, allowing one Core 0.13.1 runtime.
Its prepared compatibility cohort (Agent UI 0.2.4 / Repository UI 0.2.2) changes
only manifest/lock/changelog metadata from the prior tag. Exact source e12cdc8a
passed CI 43525331962; publication 43529780577 passed artifact equality,
provenance and clean signed-install checks for both packages. No Agent UI
implementation was changed for this adoption.

Production manifests use normal semver ranges and a registry-backed lockfile;
the earlier archive preview stays isolated under ignored .local.

## Maintenance adoption and regression

The catalog adds a fixture-only 130-card wide shell and standalone board, with
no GitHub transport or credentials. The wide journey opens Activity, scrolls to
the final card and opens the joined inspector. The browser geometry regression
opens the final card of a 100-card lane and checks the bounded mounted count,
visible inspector and retained header/outer scroll position.

The new three-digit collapsed count exposed insufficient contrast in the
application-owned Activity accent; it now mixes in a small amount of black.
The diagnostic story had two type errors (an unsupported Testing Library option
and mismatched component render args); both were corrected at the owning story.
No assertions or accessibility rules were weakened.

The rebased archive preview passes formatting, architecture, types, all 88 unit,
15 browser, 95 Storybook interaction/accessibility and seven PWA cases, plus the
application and static Storybook builds. The earlier preview used Repository UI 0.2.1; final adoption advances it to
0.2.2 to preserve the canonical single-runtime boundary. The complete
installed-registry checks and hosted acceptance are recorded below.

Changed stories remain visual-pending; no screenshot comparison or baseline
update is performed.

## Earlier cache delivery

Cached-detail revision 7b026b31096c8d11b12236b49aceac2d0cc63538 passed hosted run 43324617580. The downloaded exact Pages artifact matched the served index,
service worker, manifest and icons. Live isolated acceptance passed installation,
offline cold reload and online reconnect, with no GitHub requests from the
unauthenticated/offline shell; this receipt completes the previous cache slice's
hosted gate.

## Registry adoption — 2026-11-14

The final install consumes Design Core 0.13.1 and Repository UI 0.2.2 from npm,
with one Core runtime and no archives, overrides, patches or source aliases.
The new Core range also advances its Mira dependency to published 0.1.5.
The first install command rejected the unsupported `--prefer-online` option;
the corrected pinned pnpm 10.34.5 install and frozen reinstall both pass with
Node 24.15.0 and the existing store.

The exact browser regression passes at both 1280px and 1800px (2/2): the last
card is visible and opens its inspector, fewer than 30 lane cards are mounted,
and the board header and outer scroll position remain stable. The two exact
fullscreen stories pass. Manual Brave fullscreen exposed one diagnostic-story
readiness failure: it scrolled before the expanded virtual lane settled. The
story now waits for usable viewport geometry and scrolls through measurement
updates until the final card exists; it retains the original activation and
inspector assertions. Both exact stories pass again (2/2).

The corrected story was opened in the user's Brave fullscreen window; its
123-card Activity lane scrolled and successive deep-card activations updated
the joined inspector while the shell remained painted. The in-app browser also
renders the populated fixture. These observations do not establish the
engine-level graphics cause or rule out every intermittent flicker.

Installed-registry checks pass formatting, architecture, Svelte/TypeScript
(zero errors/warnings), 88 unit tests, 16 browser tests, 95 Storybook
interaction/accessibility cases, seven PWA cases, app/static Storybook builds
and canonical specification checks. After the readiness correction, the full
95-case Storybook lane, static catalog, quality and specification checks pass
again with zero functional or accessibility failures. Hosted deployment remains
pending below.

Fresh registry downloads match npm's SHA-512 integrity for both packages and
have provenance metadata. Core's SHA-256 matches the verified release artifact
above; Repository UI's SHA-256 is
`ae795147e440a951cd7f967237546c2eef362ef857c6e209cc996bf52b130e77`.
Source main CI 43527753030 and Repository UI publication 43529780577 are both
confirmed successful at their recorded source heads.

Registry latest spec-validator is still 0.2.0. The actual
`pnpm exec spec-validator doctor --json` passes eight checks with two QMD
availability warnings. `pnpm spec:search --semantic` executes the documented
rg fallback because the system QMD binary is absent. No global tooling is
installed or changed.
