import { expect, it } from "vitest";
import { maintenanceColumns } from "./board";
import { snapshotFixture } from "../../catalog/fixtures";

it("gives running work a separate lane while retaining every item exactly once", () => {
  const snapshot = snapshotFixture();
  const columns = maintenanceColumns(snapshot.items, snapshot.fetchedAt);
  const running = columns.find((column) => column.label === "Running");
  expect(running?.cards.map((card) => card.id)).toEqual(["running"]);
  const activity = columns.find((column) => column.label === "Activity")!;
  expect(activity.cards.map((card) => card.id).sort()).toEqual([
    "cancelled",
    "dependency",
  ]);
  const ids = columns.flatMap((column) => column.cards.map((card) => card.id));
  expect(ids.toSorted()).toEqual(
    snapshot.items.map((item) => item.id).toSorted(),
  );
  expect(new Set(ids).size).toBe(ids.length);
});
