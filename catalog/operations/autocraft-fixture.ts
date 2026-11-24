import type { AutocraftEvidence } from "../../src/maintenance/autocraft-types";
export function autocraftFixture(
  state: AutocraftEvidence["state"] = "current",
): AutocraftEvidence {
  const head = "a".repeat(40),
    source = "b".repeat(40),
    now = Date.now();
  return {
    state,
    sourceRevision: "c".repeat(40),
    reason:
      state === "current"
        ? "Synthetic AutoCraft evidence · fixture only."
        : "AutoCraft report is stale or unavailable. Manual controls remain available.",
    report:
      state === "unavailable" || state === "unsupported"
        ? undefined
        : {
            schemaVersion: 1,
            kind: "lapis-autocraft-operations",
            observedAt: new Date(now).toISOString(),
            sourceRevision: source,
            policyDigest: "d".repeat(64),
            worker: {
              healthy: true,
              enabled: true,
              phase: "idle",
              actor: "fixture-worker",
              actorId: 12,
              lastScanAt: now,
            },
            dependency: {
              state: "current",
              sourceRevision: source,
              reason: "Qualified dependency evidence",
            },
            coverage: {
              total: 1,
              shown: 1,
              complete: true,
              deploymentsTotal: 0,
              deploymentsShown: 0,
            },
            deployments: [],
            rows: [
              {
                repository: "example/repair",
                number: 148,
                head,
                base: source,
                url: "https://github.com/example/repair/pull/148",
                state: "needs-independent-review",
                action: "review",
                reason: "Repair author cannot provide independent approval",
                receipt: {
                  id: "fixture-repair",
                  actor: "fixture-worker",
                  actorId: 12,
                  head,
                  action: "repair",
                  outcome: "succeeded",
                  started: now - 1000,
                  finished: now,
                  evidence:
                    "Focused regression: 1 failure before, 0 after. Full required lanes passed.",
                },
              },
            ],
          },
  };
}
