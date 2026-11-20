import { expect, it } from "vitest";
import { operatorFixture } from "../../catalog/operations/fixtures";
import {
  currentReleaseIntent,
  currentRepositoryOperation,
} from "./operations-current";

it("distinguishes published bytes from coordinator admission", () => {
  const snapshot = operatorFixture();
  const report = snapshot.coordinator!.report!;
  report.publications.push({
    name: "@example/foundation",
    version: "1.0.1",
    integrity: "sha512-fixture",
  });
  report.releases[0]!.version = "1.0.1";

  expect(currentReleaseIntent(report, report.releases[0]!)).toMatchObject({
    status: "admission-wait",
    publishedVersion: "1.0.1",
    summary:
      "example/foundation · published 1.0.1; coordinator admission or qualification remains",
  });
});

it("does not claim that unrelated publication history satisfies a waiting intent", () => {
  const snapshot = operatorFixture();
  const report = snapshot.coordinator!.report!;
  report.publications.push({
    name: "@example/foundation",
    version: "0.9.0",
    integrity: "sha512-historical",
  });

  expect(currentReleaseIntent(report, report.releases[0]!)).toEqual({
    status: "release-wait",
    summary:
      "example/foundation · verified publication inventory exists; coordinator release intent remains waiting",
  });
});

it("claims no open pull request only with complete live coverage", () => {
  const snapshot = operatorFixture();
  const node = snapshot.coordinator!.report!.nodes[1]!;
  snapshot.repositories = [
    {
      repository: node.repository,
      available: true,
      inventory: { pullRequests: true, workflows: true },
      actions: {
        branch: "main",
        sha: node.sourceSha,
        state: "passed",
        workflows: 4,
      },
    },
  ];

  expect(currentRepositoryOperation(snapshot, node).pullRequests).toEqual({
    known: true,
    count: 0,
    label: "No open pull request observed.",
  });

  snapshot.repositories[0]!.inventory!.pullRequests = false;
  expect(currentRepositoryOperation(snapshot, node).pullRequests).toEqual({
    known: false,
    count: 0,
    label: "Pull-request state is unavailable.",
  });
});

it("counts passing open pull requests and withholds retained work when coverage is unavailable", () => {
  const snapshot = operatorFixture();
  const node = snapshot.coordinator!.report!.nodes[0]!;
  snapshot.repositories[0] = {
    repository: node.repository,
    available: true,
    inventory: { pullRequests: true, workflows: true },
    actions: {
      branch: "main",
      sha: node.sourceSha,
      state: "passed",
      workflows: 4,
    },
  };
  snapshot.items = [
    {
      ...snapshot.items[0]!,
      id: "pr:example/consumer:7",
      kind: "pull-request",
      number: 7,
      status: "passed",
      target: { kind: "pull-request", sha: node.sourceSha },
    },
  ];

  expect(currentRepositoryOperation(snapshot, node).pullRequests).toMatchObject(
    {
      known: true,
      count: 1,
      label: "1 open pull request observed.",
    },
  );

  snapshot.repositories[0]!.available = false;
  const unavailable = currentRepositoryOperation(snapshot, node);
  expect(unavailable.pullRequests.label).toBe(
    "Pull-request state is unavailable.",
  );
  expect(unavailable.actions.state).toBe("unknown");
  expect(unavailable.currentItem).toBeUndefined();
});

it("keeps live approval state separate from coordinator shorthand", () => {
  const snapshot = operatorFixture();
  const node = snapshot.coordinator!.report!.nodes[0]!;
  snapshot.repositories[0] = {
    repository: node.repository,
    available: true,
    inventory: { pullRequests: true, workflows: true },
    actions: {
      branch: "main",
      sha: node.sourceSha,
      state: "pending",
      workflows: 4,
    },
  };
  snapshot.items.push({
    id: "deployment:example/consumer:3:9",
    repository: node.repository,
    title: "Publish · production approval",
    kind: "approval",
    status: "approval-wait",
    category: "release",
    updatedAt: snapshot.fetchedAt,
    url: "https://github.com/example/consumer/actions/runs/3",
    reasons: ["Environment: production"],
    target: {
      kind: "deployment",
      sha: node.sourceSha,
      runId: 3,
      environmentId: 9,
    },
    actions: [
      {
        kind: "approve-deployment",
        label: "Approve deployment",
        available: true,
      },
    ],
  });

  const current = currentRepositoryOperation(snapshot, node);
  expect(current.actions).toMatchObject({ state: "pending", label: "Pending" });
  expect(current.currentItem).toMatchObject({
    id: "deployment:example/consumer:3:9",
    status: "approval-wait",
  });
  expect(current.pullRequests.label).toBe("No open pull request observed.");
});

it("makes report and live source disagreement explicit", () => {
  const snapshot = operatorFixture();
  const node = snapshot.coordinator!.report!.nodes[0]!;
  snapshot.repositories[0] = {
    repository: node.repository,
    available: true,
    inventory: { pullRequests: true, workflows: true },
    actions: {
      branch: "main",
      sha: "f".repeat(40),
      state: "passed",
      workflows: 4,
    },
  };

  expect(currentRepositoryOperation(snapshot, node).source).toEqual({
    state: "different",
    label:
      "Observed coordinator source differs from the refreshed default branch.",
  });
});
