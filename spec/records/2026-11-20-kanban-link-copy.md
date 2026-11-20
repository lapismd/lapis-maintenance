# Kanban GitHub link copy — 2026-11-20

## Scope

Kanban column options need a compact way to copy the authoritative GitHub
targets for the cards currently visible in that lane. Inspector footer actions
also need spacing owned by their footer container rather than by a particular
action row.

## Contract

- Maintenance composes Design Core's public column-menu extension with an
  icon-labelled `Copy GitHub links` item.
- Activation copies the current visible card URLs in lane order as newline-
  separated absolute GitHub links, closes the menu and reports success or
  clipboard failure through the existing toast host.
- Empty columns keep the item visible but disabled. Copying does not fetch,
  mutate GitHub or write account caches.
- The review inspector footer owns its inset on every edge so workflow-only and
  PR action sets retain spacing independently of their child layout.

## Verification

The board story asserts the exact fixture-link clipboard payload, Copy icon, menu
closure, success toast and disabled empty-lane state. The workflow inspector
story measures positive container padding and confirms the Cancel workflow
button remains inside all four footer edges. Required repository lanes are run
before the release commit; visual review remains non-blocking and no baseline is
updated.
