# R3 efficient read foundation

The shared four-slot transport now caches named, read-only GraphQL batches and
shares independently cancellable consumers. Twenty-PR controlled inventory
acceptance proves at least 50% fewer requests than the REST-only fixture, with
identical classified targets/statuses and scoped fallback for partial errors.
A real authenticated query schema probe succeeded; populated live mapping and
production resource integration follow in R4.

Command validation now belongs to one action-specific adapter preflight. Merge,
readiness and comments avoid unrelated reviews/checks; approval checks the
current revision. Disposal aborts validation before any subsequent write.
Independent resource caches and delayed intent prefetch have bounded retention,
repository/resource fences and serialized persistence.

## Verification

- Single-preflight regression failed on duplicate reads before repair; passes.
- Disposal regression found a command-signal propagation gap; the repaired exact
  lifetime set passes 30 tests. Resource-cache/prefetch set passes 8 tests.
- Full unit: 139 passed; types, formatting and architecture pass.
- Full Storybook interaction/accessibility: 167 passed. App and static builds pass.
- Browser first run: 1 failed / 15 passed because the read-only fixture classified
  GraphQL POST as a mutation. The repaired fixture asserts query-only operations;
  exact browser regression passes, followed by a clean full browser lane.
- Canonical format and mapped spec-first omissions were repaired and rechecked.

These foundations do not yet replace the live screen; R4 wires the reviewed
components, independent resources, routing and lazy activity to the session.
