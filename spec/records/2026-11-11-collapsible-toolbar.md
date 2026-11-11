# Collapsible dashboard controls — 2026-11-11

User request: collapse the fixed top section to leave more room for the Kanban
board on mobile. The production toolbar will compose the public Design Core
Collapsible and retain the shell's responsive mode, navigation and utilities.
Mobile starts compact; desktop starts expanded, with independent choices while
the toolbar is mounted. Filters remain controller-owned when controls are hidden.

## Regression and verification

Focused command:
`pnpm exec vitest run --project storybook catalog/components/Toolbar.stories.ts catalog/ToolbarInteractions.stories.ts -t 'Toggle Controls|Mobile'`.
Before the implementation: 2 failed, 3 nonmatching stories skipped because the
desktop collapse and mobile expand controls did not exist.
The first implementation run passed desktop and failed the mobile height check
while the disclosure's exit lifecycle was still settling (1 passed, 1 failed).
The mobile assertion now waits for the same final height and additionally checks
the collapsed ARIA state; no height threshold or product assertion was weakened.
The exact command then passes both targets in a fresh Vitest browser process
(2 passed, 3 nonmatching stories skipped).
The first complete interaction run reported 81 passed and 1 failed: the desktop
story asserted input removal before the same exit lifecycle settled; it now
waits for removal without weakening the assertion and also checks retained
keyboard focus. Type checking caught one unsupported Testing Library option,
replaced by an equally exact name expression, and formatting was corrected.

## Final local verification

- The exact focused command passes 2 cases, with 3 nonmatching cases skipped;
  the complete interaction/accessibility lane passes all 82 cases in 25 files.
- All 63 unit tests, 5 browser cases and 7 real-build PWA cases pass.
- Formatting, types, architecture/file budgets, app build, static fixture
  Storybook and all four specification lanes pass.
- Spec-validator's latest Deno-free release is still 0.2.0; doctor passes
  11 checks without warnings and real QMD semantic discovery succeeds.
- A fresh 390 × 844 fixture browser gives the board 694.6px with controls
  collapsed versus 426.2px expanded, reclaiming 268.4px; resizing to 1280px and
  back preserves independent desktop/mobile choices and the search filter,
  with no browser errors or GitHub requests.

The production screen and standalone toolbar both compose the same production
component. Mobile and keyboard interaction stories cover the real controls;
the main breadcrumb, status, refresh and sidebar controls remain available.
Visual review stays visual-pending; no screenshot comparisons or baseline updates.
