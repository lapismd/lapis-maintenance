# Disposable real-GitHub write target

This branch exists solely to exercise the authorized Maintenance Slice 3
production adapters. It is not a candidate for main and must never target main.
PR acceptance uses maintenance-acceptance/base-20261110 as its isolated base.
Its workflow passes for that PR; the dedicated run-20261110 branch deliberately
fails after a bounded 45-second wait to exercise rerun and cancellation.
No checkout, application code, dependency installation or secret is involved.
Canonical authority is LM-ACT-001 in the active implementation workspace.
