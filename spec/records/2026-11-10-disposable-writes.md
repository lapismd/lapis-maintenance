# Disposable real-GitHub PR and workflow acceptance

Requirement: LM-ACT-001. The user authorized PR/CI writes and finishing the
published application. All acceptance effects targeted isolated branches in
lapismd/lapis-maintenance; no product branch, release environment, secret or
publication workflow was changed by these tests.

The ignored manual driver .local/disposable-write-acceptance.mjs loaded the
production GithubCommandPort, GithubTransport, GithubWriteTransport,
readPull, readWorkflow and readItemDetails through Vite SSR. A narrow host read
port admitted only the recorded targets and performed real fresh GitHub reads;
no GitHub responses or writes were mocked. The existing gh CLI credential was
held only in process, never printed or saved. Native browser transport and UI
confirmation were independently covered by the five mocked browser tests.

## Isolated targets

- [PR #1](https://github.com/lapismd/lapis-maintenance/pull/1), authored as a draft,
  targeted maintenance-acceptance/base-20261110, never main.
- Its displayed head was 1258813bd85724b10e03de99565523678c2f4ff6; passing
  disposable-check CI ran on that PR. The driver asserted the base, head branch
  and SHA before enabling any action.
- [Workflow run 42924519045](https://github.com/lapismd/lapis-maintenance/actions/runs/42924519045)
  targeted maintenance-acceptance/run-20261110 at
  c19b92e61a57fe74b996101f9f6517fd0a1c62ae. It ran only a bounded 45-second
  wait and deliberate exit 1, with a three-minute job timeout, no checkout,
  dependency install or secret access. Its revision differed from the PR's.

## Results

Commands: Node 24.15.0 node .local/disposable-write-acceptance.mjs followed by
pr, merge, rerun and cancel, executed sequentially.

| Operation                              | UTC time | Observed result                                                   |
| -------------------------------------- | -------- | ----------------------------------------------------------------- |
| Mark draft ready                       | 23:35:58 | Completed; GitHub returned non-draft on the displayed head        |
| Review comment                         | 23:36:01 | Completed; GitHub returned COMMENTED with the displayed commit_id |
| Self-approval                          | 23:36:05 | Rejected by fresh capability validation; no approval write        |
| Merge with an all-zero SHA             | 23:36:08 | Rejected by fresh target validation; no merge write               |
| Squash merge with actual displayed SHA | 23:36:23 | Completed; GitHub confirmed merged=true into the disposable base  |
| Rerun failed jobs, attempt 1           | 23:36:29 | Accepted; GitHub created attempt 2                                |
| Cancel running attempt 2               | 23:36:52 | Accepted; a subsequent read confirmed completed/cancelled         |

The disposable merge commit is 9caac13f999f44a8dfa9fdd8bba6f501d43f16c8.
The exact results/targets were retained in .local/disposable-write-receipt.json.
This proves successful real readiness, comment, merge, rerun and cancellation,
plus rejection of self-approval and a stale target. Positive cross-user approval,
change requests and approval-required fork runs remain mocked/manual-user
coverage; this record does not claim a second account or fabricated approval wait.
Deployment review and workflow dispatch are outside the authorized app slice.
The three created remote acceptance branch refs were removed after verification;
their commits remain in local Jujutsu history and the merged PR/run retain the
external evidence. No unrelated refs were changed.
