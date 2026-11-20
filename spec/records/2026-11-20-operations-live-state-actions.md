# Live Operations state and tangible actions

Owners: LM-OPS-001, LM-CTRL-001, LM-GH-001, LM-GH-004, LM-UI-001,
LM-UI-004, LM-ACT-003, LM-REL-001 and LM-PR-002.

## Diagnosis and policy

The Operations screen previously collapsed coordinator policy evidence, live
GitHub activity and release intent into one status. A coordinator report could
therefore remain fresh by its own contract while no pull request or workflow was
currently active, and a published package could still appear to wait for
publication when only admission or qualification remained.

Operations now joins coordinator nodes to the current repository snapshot while
preserving the two sources as separate signals. Rows show coordinator and live
GitHub status independently, disclose observation and refresh times, expose
source-revision agreement or drift, and claim that no pull request exists only
when pull-request coverage is complete. Published bytes and coordinator
admission are also presented independently.

Passing open pull requests are counted even when their checks are green. A
retained item cannot expose a write control or prove absence when repository,
workflow or pull-request coverage is unavailable. Failed refreshes call the
snapshot retained, source comparison is described as an observation, and
publication history is not treated as the current intent unless its exact
package/version matches. Otherwise the UI reports verified history without
claiming that the waiting intent was satisfied.

Contextual actions derive only from live item capabilities and existing
fresh-preflight command adapters. Operators can refresh current state, open the
exact live work, navigate to approvals, workflows or pull requests, execute an
eligible approval or rerun, or open the coordinator's reviewed manual workflow
dispatcher. Coordinator report text remains evidence and never grants command
authority. Policy exclusions and product holds explain why replay cannot repair
them.

Workflow choices use the validated primary attention reason: reconciliation and
rollout may open coordinator discovery, publication and qualification may open
the owning repository's discovery, and source/product/policy holds do not invent
a workflow. Channel-policy links bind the report's exact policy revision;
unrelated repository issues are not presented as owning remediation. Repeated
controls have repository-qualified accessible names.

The Operations entry performs a forced refresh on mount so reopening the screen
does not silently reuse an older snapshot. The catalog fixture preserves the
contradictory state that triggered this work as interaction and accessibility
regression coverage.

Default-branch Actions health now qualifies only push-event workflows at the
current revision. Scheduled qualification, manual publication, chained
notification and Dependabot dynamic runs on the same SHA remain available as
workflow evidence, but their independent outcomes no longer turn an otherwise
passing current branch badge red.

## Regression evidence

- The first focused unit run failed because the live-state projection did not
  exist; all six exact state, coverage and publication cases now pass.
- The exact branch-actions regression initially failed one of nine cases,
  reporting four workflows and a failed branch when one current push workflow
  had passed beside three unrelated same-revision failures. After event-aware
  qualification, all nine cases pass and the branch reports one passing push
  workflow.
- The focused Operations browser run exposed one fixture that did not identify
  the intended release version. The fixture now proves the exact-version rule;
  all five Operations browser cases pass, including initial-loading refresh.
- The first focused Storybook run exposed one ambiguous locator, repeated
  section landmark labels and a duplicated repository diagnostic. Those five
  failures were repaired without weakening assertions; all 20 focused
  Operations interaction/accessibility cases pass.
- Repository-wide qualification passes 284 unit, 44 browser, 232 Storybook
  interaction/accessibility and seven PWA cases with zero failures.
- Formatting, architecture boundaries and Svelte diagnostics pass with zero
  errors or warnings. The production build, static Storybook build, package
  doctor and all four canonical specification lanes also pass. Changed stories
  remain visual-pending; no screenshots or baselines are compared.
