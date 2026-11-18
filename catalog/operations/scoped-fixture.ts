import controlled from "./scoped-report.json";
import { parseCoordinatorReport } from "../../src/github/coordinator-report";
import { operatorFixture } from "./fixtures";
/** Historical public SDK pair plus test grants/CI: not live Desktop qualification. */
export function scopedFixture() {
  const snapshot = operatorFixture();
  snapshot.coordinator = parseCoordinatorReport(
    structuredClone(controlled),
    controlled.policyRevision,
    Date.parse(controlled.observedAt),
  );
  snapshot.coordinator.reason =
    "Controlled historical SDK report: test-only grants and CI, not live Desktop qualification.";
  snapshot.items = [];
  snapshot.issues = [];
  snapshot.repositories = [
    { repository: "lapismd/lapis-desktop", available: true },
  ];
  return snapshot;
}
