import { expect, it } from "vitest";
import { validAttentionEvidence } from "./attention";
import { attentionReason, type WaveNode } from "./operator-types";

const node = (): WaveNode => ({
  visibility: "public",
  repository: "lapismd/consumer",
  sourceSha: "a".repeat(40),
  operationId: "operation",
  status: "held",
  holds: ["outside pilot phase"],
  waits: [],
  updates: [],
  acceptance: { state: "qualified", reason: "current checks passed" },
  ownership: { state: "bot-owned", reason: "verified" },
});

it("uses the highest-priority structured reason instead of a generic hold", () => {
  const value = node();
  value.attention = [
    {
      code: "rollout-phase",
      category: "rollout",
      summary: "Requires full rollout",
      detail: "outside pilot phase",
      remediation: "Review pilot evidence.",
      repository: value.repository,
      sourceSha: value.sourceSha,
    },
    {
      code: "branch-reconciliation",
      category: "branch-reconciliation",
      summary: "Dependency branch requires reconciliation",
      detail: "retained dependency branch",
      remediation: "Review the retained branch.",
      repository: value.repository,
      sourceSha: "b".repeat(40),
      branch: "lapis-dependencies/lapis-first-party",
    },
  ];
  expect(attentionReason(value)).toBe(
    "Dependency branch requires reconciliation",
  );
});

it("falls back to the first concrete legacy hold", () => {
  expect(attentionReason(node())).toBe("outside pilot phase");
});

it("rejects arbitrary links and malformed attention coordinates", () => {
  const value = node();
  value.attention = [
    {
      code: "rollout-phase",
      category: "rollout",
      summary: "Requires full rollout",
      detail: "outside pilot phase",
      remediation: "Review pilot evidence.",
      repository: value.repository,
      sourceSha: value.sourceSha,
    },
  ];
  expect(validAttentionEvidence(value)).toBe(true);
  (value.attention[0] as unknown as Record<string, unknown>).url =
    "https://example.invalid/action";
  expect(validAttentionEvidence(value)).toBe(false);
  delete (value.attention[0] as unknown as Record<string, unknown>).url;
  value.attention[0].branch = "../unsafe";
  expect(validAttentionEvidence(value)).toBe(false);
});
