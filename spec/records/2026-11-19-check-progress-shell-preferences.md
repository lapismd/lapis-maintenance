# Check progress, shell status and theme preference

Owners: LM-UI-001, LM-UI-003, LM-PR-001 and LM-GH-002.

## Changes

Running linked checks use a motion-aware spinner in the panel, group and row.
GitHub check-run and workflow-job timestamps pass through the normalized detail
model: running checks show an updating elapsed duration, completed checks show a
fixed duration, and unreliable or missing timestamps render no invented value.

The counted session status control moves out of the toolbar into a compact,
centred footer within the main AppShell body. It retains the status popover,
retry action, activity coverage and fixture/live notices while leaving primary
navigation and refresh controls in the header.

An explicit light or dark selection is stored under the versioned,
non-sensitive `lapis-maintenance:theme:v1` browser preference. Startup restores
only valid values before falling back to the system preference; unavailable
storage does not prevent theme switching, and valid changes from another tab
are applied.

## Regression and qualification

Pure unit coverage owns timestamp validation/formatting and storage failure
handling. GitHub mapping coverage owns check-run and job timestamps. The running
check story owns spinner and duration presentation, while the production app
browser case owns explicit selection and remount restoration. Full unit,
browser, PWA, Storybook interaction/accessibility, production/static build and
canonical specification lanes remain required. Visual baselines are unchanged.

The pre-change unit lane passed 273 cases. Browser and Storybook baselines were
initially blocked before collection because the required Playwright Chromium
revision was absent; installing that repository-required runtime repaired the
local test environment. During regression development, the app browser case
first reported one ambiguous Close-button test query, and the running-check
story first reported one incorrect expected fixture duration. Both retained
their behavior assertions and then passed. The first full Storybook run reported
two obsolete tests that still located status inside the toolbar; the corrected
tests assert the dedicated body footer and responsive bounds.

Final local qualification passes 277 unit, 42 native browser, 229 Storybook
interaction/accessibility and seven PWA cases with zero failures. Formatting,
architecture/file budgets, Svelte diagnostics, production build, static
Storybook build and all four canonical specification lanes pass. The semantic
search used its printed `rg` fallback because the external QMD installation
continues to report a Node ABI mismatch after both prescribed repairs; the
repository validator itself is the latest 0.2.1 release and `spec:check` passes.
