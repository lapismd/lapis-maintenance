# PR review preview foundation — 2026-11-14

The user revised the follow-up to "the first slice as just the UI showing the
changes in storybook" and "Keep components in this repo please for now".
PLAN.md, the repository guide, canonical requirements, verification map and slice
tracker record that boundary before UI implementation. Live application code,
adapters, persistence, navigation, dependencies and sibling repositories remain
outside this slice. New local production components use fixture-only hosts.

The preceding read-only investigation found T3's batched PR reads, scoped cache,
independent resources, intent prefetch and exact fork/head approval validation.
It found conclusion-only approval matching, discarded check/job URLs and
duplicated preflight reads in Maintenance. Existing focused action-policy,
command-port and read-port tests pass 30/30; live repairs stay planned.

Latest published Deno-free spec-validator is 0.2.0, already installed. With Node
24.15.0 and pnpm 10.34.5, doctor passes all 11 checks and semantic specification
search uses healthy QMD. Foundation formatting/specification checks are recorded
with the foundation commit. UI verification is pending until R1 implementation.
The first validation found two chapters with five acceptance bullets; their new
boundary text was folded into existing bullets to retain the required 2–4
atomic acceptance bullets. Validation is rerun with the same rules.

No T3 implementation is copied into the preview. Later adaptations must retain
their source revision and MIT attribution. Screenshot comparisons and baseline
updates remain excluded; the preview must stop for user review before R2.
