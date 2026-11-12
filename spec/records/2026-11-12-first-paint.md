# Remembered-session first paint and Inbox controls — 2026-11-12

## Observed boundary

Read-only diagnostics of the open app confirmed a 160-card, 97,137-byte assembled
snapshot in IndexedDB. The snapshot was fresh, but session startup awaited the
GitHub `/user` request before opening that database. The prior reload test blocked
allowlist discovery only, so it did not prove rendering before authentication.

The online bootstrap now remembers the last validated identity with its token,
opens the same token-derived partition immediately and publishes a read-only
controller snapshot before token validation completes. Provider reads and command
authority attach only after successful authentication. Controller/filters survive
the handoff. Rejection clears the preview, credentials and active cache;
disconnect/disposal prevent late reattachment. Offline account-data boundaries
are unchanged. Legacy token-only records authenticate once before saving the hint.
IndexedDB startup uses its timestamp index to prune expired entries without
walking all current response bodies.

At tablet widths the prior 1024-pixel mobile breakpoint presented a modal details
lane: clicking the visible board dismissed that lane. The app now uses public
AppShell settings to retain adjacent board/inspector from 800 pixels, preserving
the phone panel presentation. Card activation explicitly expands the inspector,
including after its toolbar collapsed it; selecting another item retains the
pane. This is app-owned layout policy, with no package patch or CSS concealment.

The PWA update control uses the public ghost icon button and a filled Lucide
ArrowBigUp, with accessible name/title Update and the existing busy guard.

## Regression ledger

- Blocked-authentication real-IndexedDB reload: one failure before, one pass
  after; the test now establishes the saved identity through production login.
- Correctly scoped tablet selection at the former breakpoint: one failure;
  fresh accessible card selection remains required after opening the inspector.
- Update interaction at its requested accessible name: one failure before.
- Making both board and details accessible exposed ambiguous test queries for
  repeated headings and two sidebar controls. Assertions now target their owning
  heading/toolbar, retaining all outcomes. The toolbar-collapse journey then
  exposed a real app defect: open() did not clear collapsed state; expand() does.
- Existing session/device tests passed; added tests verify cached commands cannot
  validate, revocation clears data, authentication retains filters/controller,
  and disconnect during validation prevents reattachment.

Identity-metadata updates do not sign out other tabs with the same token; token
replacement/removal still retires their stale sessions. Repository configuration
waits for authentication while cached-item filters remain usable.

## Qualification

- Exact blocked-authentication persistent-cache browser case passed. Timestamp
  pruning retains the strict one-day boundary. Real-pointer inspector selection
  passed at both 910 and 1800 pixels; reopening a collapsed inspector also passed.
- Final `pnpm test`: 83 passed. `pnpm test:browser`: 13 passed.
- All 91 Storybook interaction/accessibility cases and all seven PWA cases passed.
- App and static Storybook builds, formatting, types, source boundaries and all
  four specification lanes passed. The spec audit caught an 81-word acceptance
  bullet and a missing mapped controller chapter; both were corrected without
  changing validation rules.
- Latest published spec-validator remained 0.2.0. Doctor passed nine checks with
  two QMD availability warnings; discovery used the documented rg fallback.

Deployment and live browser acceptance follow the checked source. Changed
stories remain visual-pending; no screenshot baselines are updated.
