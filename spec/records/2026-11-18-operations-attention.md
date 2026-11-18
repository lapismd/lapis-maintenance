# Concrete Operations holds and remediation

The live coordinator report already exposed hold, wait, branch and qualification
evidence, but the compact Operations timeline mapped an ordinary held node to
the generic text `Explicit hold`. Expanded content exposed raw reasons without
an ordered mitigation path, while publication and branch coordinates were not
presented as direct links.

Maintenance now validates the coordinator's optional structured attention
projection before presentation. Compact rows choose the highest-priority reason,
show a restrained category chip and retain their existing status chip. Expansion
shows the concrete detail, remediation and derived GitHub or npm links; no
arbitrary report URL or action descriptor is accepted. Legacy reports use the
first concrete hold and retain the prior raw-details presentation.

The exact unit regression failed 2/2 before implementation because both paths
returned `Explicit hold`. The focused attention, coordinator and retained-cache
tests now pass 35/35, and `svelte-check --fail-on-warnings` reports zero errors
and zero warnings. The fixture-only Operations story includes a retained branch
with its expected remediation and exact GitHub branch link for interaction and
accessibility qualification. Repository-wide checks, 273 unit tests, 229
Storybook interaction/accessibility tests, the static Storybook build, the
production build and all canonical specification lanes pass.
