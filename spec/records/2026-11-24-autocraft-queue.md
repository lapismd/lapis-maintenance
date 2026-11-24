# AutoCraft queue evidence

The authorized AutoCraft follow-up adds read-only queue and operation-receipt
visibility to Maintenance. AutoCraft owns automation policy and writes;
Maintenance owns authenticated GitHub report reads and presentation.

Focused regression command:
`pnpm exec vitest run --project unit src/github/autocraft-report.test.ts`.
Initial run: two failures, comprising one duplicate-target parser defect and one
fixture assertion that matched explanatory prose instead of an unknown JSON key.
The parser now rejects duplicate PR identities; the assertion checks the actual
unknown key. Exact rerun: three passed, zero failed. No command authority was added.

Focused cancellation/host tests: five passed, zero failed across reader and resource
suites. Cold browser target `src/app/autocraft.browser.test.ts`: one passed, zero
failed. It exercises lazy loading, immutable PR links, typed regression receipts,
failed-report feedback, preserved manual capabilities, no command invocation and
disconnect cleanup. Full repository qualification and hosted acceptance are
recorded before delivery; live tokens never enter fixtures or artifacts.

Qualification completed on the supported Node 24.19.0 runtime:

- `pnpm check`: formatter, architecture budgets and Svelte diagnostics passed
  with zero warnings.
- `pnpm test`: 293 passed; `pnpm test:browser`: 41 passed from a cold Vite process.
- `pnpm test:storybook`: 235 passed, including the fixture-only AutoCraft stories
  and configured accessibility lane; no visual baseline comparison or update.
- `pnpm build`, `pnpm build-storybook`, and `pnpm test:pwa` passed, with seven PWA tests.
- `pnpm spec:check`: four lanes passed; `pnpm exec spec-validator doctor`: eleven passed with no warnings;
  semantic specification search completed and registry validator 0.2.1 confirmed.
- A manual credential-private acceptance exercised the production reader through
  its real GitHub transport: report commit
  `855af7cec1a5ce5d3b1f1ced07d93383cff524d6`, worker source
  `bfe03edbb0857665f5cd1d5b280fc6fa0a2421cd`, matching current policy and verified
  ancestry, current state, three rows and complete coverage; no writes were made
  and the token was neither printed nor retained in an artifact.

Hosted PR CI, merge and Pages rollout remain separate required acceptance.
