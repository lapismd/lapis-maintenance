# Merge-queue workflow coverage

Owners: LM-GH-001, LM-CTRL-001 and LM-UI-001.

## Diagnosis and policy

GitHub merge queues create `gh-readonly-queue/...` refs and delete them after a
pull request merges. The workflow inventory already selects current default
branch runs by the resolved immutable SHA, but the repository reader previously
tried to resolve every unassociated completed run by its reported branch name.
For a successful `merge_group` run whose SHA became `main`, this redundant read
returned HTTP 422 after GitHub deleted the queue ref. The dashboard then marked
workflow coverage unavailable even though the run, commit and current default
branch were all readable.

Current-default-SHA evidence is now authoritative for that association check.
Other unassociated completed branch runs retain their branch-resolution guard,
and waiting runs retain their approval handling. HTTP 422 responses describe an
unresolvable or invalid resource reference rather than implying that the token
lacks repository permissions.

## Regression evidence

- Before the implementation, the exact merge-queue regression failed because
  the repository was unavailable. After the fix, it passes with no deleted-ref
  request; the focused HTTP 422 copy regression also passes.
- All 286 unit, 44 browser and 232 Storybook interaction/accessibility cases
  pass. Formatting, architecture boundaries and Svelte diagnostics pass with
  zero errors or warnings.
- The production and static Storybook builds, package doctor, QMD requirement
  search and all canonical specification lanes pass. No visual baselines were
  compared or changed.
