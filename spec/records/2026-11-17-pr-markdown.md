# Full-width PR Markdown descriptions

Owner: LM-PR-001, LM-PR-002, LM-UI-001, LM-CTRL-001 and LM-GOV-001.

The overview previously inserted the entire GitHub description into a text
paragraph, exposing Markdown punctuation and profile-context comment markers.
Use the public Design Core MarkdownContent renderer's fullWidth option and
published padding/background tokens inside a public horizontal ScrollArea.
Mira retains ownership of prose and safe HTML handling; the app retains its card
layout and raw cached body without extra reads, commands, parsing or sanitizing.

## Regression targets

- `pnpm test:browser src/app/review-markdown.browser.test.ts` covers rendered
  Markdown, wide/narrow geometry, full-width text edges and inert active content.
- `pnpm test:storybook catalog/components/ReviewMarkdown.stories.ts` covers
  semantic headings/tables/links, hidden comment markers, and light/dark/narrow
  fixture descriptions. No real repository data, credentials or network effects
  are introduced into automatic stories.

Exact before/after and complete validation results follow qualification. Visuals
remain pending without screenshot comparisons or baseline updates.

Both original browser cases failed before the product change because the
description heading was plain text; all three original Storybook cases also
failed. The same exact targets are retained after integration.

## Final local qualification

Both exact browser cases and all three exact Storybook cases now pass. At 1800px
and 480px, the rendered heading's left and right edges match the padded content
box, the full-width public option is active and the page does not overflow.
Semantic tables/links/formatting render, comments stay hidden, script nodes and
active URL schemes are absent, and rendering submits no commands.

Complete lanes pass 227 unit tests, 22 browser cases, 217 Storybook interaction/
accessibility cases and seven production PWA tests, with zero failures. Frozen
installation, format/type checks (zero errors/warnings), architecture budgets,
production/static builds and all four canonical specification lanes pass. Doctor
passes all 11 checks and QMD semantic search works with current validator 0.2.1.

A fresh owned Storybook process at port 7517 renders the populated fixture with
formatted text, task lists, a table and code block aligned to the card body. Hosted
CI, merge, Pages artifact matching and live acceptance follow the standing
approved delivery gate. No shared package change or dependency update is needed.
