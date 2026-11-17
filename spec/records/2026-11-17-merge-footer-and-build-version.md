# Compact merge footer and public build identity

Owners: LM-PR-001, LM-UI-001, LM-CTRL-001 and LM-GOV-001.

## Changes

Remove the generic merge-policy paragraph from the shared PR merge controls,
covering Overview, Checks and the inspector. Disabled execution buttons keep
that reason in their title and accessible description. Eligibility, explicit
activation, fresh preflight, auto-merge state and command authority remain
unchanged. Dynamic auto-merge state remains visible.

Expanded sidebar branding centres a small v-prefixed eight-character Git SHA
below Maintenance. Its normal GitHub link targets the full exact commit and
provides the full SHA on hover; collapsed navigation omits it. Vite embeds the
validated public GITHUB_SHA in hosted builds and Git HEAD locally. Source
archives without commit metadata show vdev without inventing a commit URL.

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
permission-denied state, link identity and centred placement. An intermediate
attribute assertion was corrected to test the actual title string with its
regular expression; no behavior assertion was dropped.

Validator 0.2.1 is the latest registry version; Doctor passes all 11 checks and
QMD semantic search works. Required full repository, browser, PWA, Storybook,
static build and canonical checks precede the unsigned commit and hosted
qualification. Stories remain visual-pending without baseline comparisons.

Local qualification passes all 244 unit, 35 browser, 223 Storybook interaction
and accessibility, and seven production PWA cases: 509 total with zero failures.
Frozen installation, formatting, architecture budgets and Svelte diagnostics pass;
production and static Storybook builds and all four canonical specification lanes
are required before pushing. Cold populated Storybook acceptance confirms the
centred exact-commit link and a merge footer containing only its controls.
