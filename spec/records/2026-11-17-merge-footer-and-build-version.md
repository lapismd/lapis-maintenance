# Compact merge footer and public build identity

Owners: LM-PR-001, LM-UI-001, LM-CTRL-001 and LM-GOV-001.

## Changes

Remove the generic merge-policy paragraph from the shared PR merge controls,
covering Overview, Checks and the inspector. Disabled execution buttons keep
that reason in their title and accessible description. Eligibility, explicit
activation, fresh preflight, auto-merge state and command authority remain
unchanged. Dynamic auto-merge state remains visible.

The sidebar preserves its original logo/text alignment and centres only a small
bare eight-character Git SHA directly beneath the Maintenance text, with a
padded sidebar-style hover background. Its normal GitHub link targets the full exact commit and
provides the full SHA on hover; collapsed navigation omits it. Vite embeds the
validated public GITHUB_SHA in hosted builds and Git HEAD locally. Source
archives without commit metadata show dev without inventing a commit URL.

The reported Operations inline results used the prior renderer: its screenshot
also showed Leave review comment and wrapped batch actions. Read-only inspection
of the currently installed Brave app confirms the current 19-repository decision
projection and a clean single-row batch footer, matching PR #14's toast policy.
No real GitHub command was activated during acceptance. The new build label
makes the running app's source identity directly inspectable.

## Regression and qualification

The exact command `pnpm exec vitest run --project storybook
catalog/components/MergeFeedback.stories.ts
catalog/components/BuildVersion.stories.ts` initially failed all three cases:
visible merge-policy copy, missing disabled-button reason and absent commit link.
All three now pass, covering an enabled merge, its simulated merged state,
permission-denied state, link identity and centred version placement with the original logo alignment and no v prefix. An intermediate
attribute assertion was corrected to test the actual title string with its
regular expression; no behavior assertion was dropped.

Validator 0.2.1 is the latest registry version; Doctor passes all 11 checks and
QMD semantic search works. Required full repository, browser, PWA, Storybook,
static build and canonical checks precede the unsigned commit and hosted
qualification. Stories remain visual-pending without baseline comparisons.

Local qualification of the responsive actions and branding passes all 244 unit,
39 browser, 223 Storybook interaction and accessibility, and seven production
PWA cases: 513 total with zero failures.
Frozen installation, formatting, architecture budgets and Svelte diagnostics pass;
production and static Storybook builds and all four canonical specification lanes
are required before pushing. Cold populated Storybook acceptance confirms the
centred exact-commit link and a merge footer containing only its controls.

The final branding correction's exact BuildVersion story initially fails its
bare-SHA contract, then passes with the original logo position and only the
version centred. The GitHub destination remains the full build commit.

The final subtitle-alignment case fails before the layout correction and passes
afterwards: only the commit label is centred beneath Maintenance, the logo keeps
its original horizontal and vertical alignment, and hover provides a padded
sidebar-accent background. The short SHA has no v prefix.

Responsive PR header actions remain visible on one row at phone, constrained and
wide widths; constrained labels become accessible icon-only buttons with full
hover titles. The Markdown renderer receives bottom padding through its public
layout token. Three native browser cases fail before this correction and pass
afterward. The version-link hover check uses native browser hover because
Storybook's synthetic hover cannot activate the CSS pseudo-class; its original
background-change assertion is retained in that real browser case.

PR lifecycle chips share a local component between the inspector and page header:
Draft uses neutral, Open success, Merged primary and Closed destructive colours,
with distinct icons and labels. Final states take precedence over a draft flag.
The exact compact-review browser target initially reports four failures and one
pass at this boundary; after the chip implementation all five cases pass. Four
Storybook states cover lifecycle labels and final-state precedence.

Toast action buttons now opt into Design Core's existing secondary variant,
providing a themed background at rest and its built-in hover/focus treatment.
The exact feedback browser target initially has one failure and four passes,
then passes all five cases with the visible background. Action activation,
expiry, deduplication and notification limits remain covered.

Final local qualification passes 244 unit, 41 native browser, 227 Storybook
interaction/accessibility and seven production PWA cases: 519 tests with zero
failures. Formatting, source budgets, Svelte diagnostics, production build,
static Storybook build and all four canonical specification lanes pass. The
native and Storybook lanes start fresh processes; no visual baselines change.
