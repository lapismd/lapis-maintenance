import type {
  AttentionCategory,
  AttentionItem,
  WaveNode,
} from "./operator-types";
import type {
  MaintenanceDetail,
  MaintenanceItem,
  MaintenanceSnapshot,
  RepositoryCoverage,
} from "./types";
import { validRepository } from "../github/models";

const categories = new Set<AttentionCategory>([
  "rollout",
  "branch-reconciliation",
  "publication",
  "source-preparation",
  "qualification",
  "policy-exclusion",
  "product-constraint",
  "other",
]);
const priority: Record<AttentionCategory, number> = {
  "policy-exclusion": 0,
  "product-constraint": 1,
  "branch-reconciliation": 2,
  qualification: 3,
  publication: 4,
  "source-preparation": 5,
  rollout: 6,
  other: 7,
};
const text = (value: unknown, limit = 4000): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  value.length <= limit &&
  !value.includes("\0");
const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const safePath = (value: unknown) =>
  text(value, 255) &&
  /^[A-Za-z0-9._/-]+$/.test(value) &&
  !value.startsWith("/") &&
  !value.split("/").some((part) => ["", ".", ".."].includes(part));
const packageName = (value: unknown) =>
  text(value, 128) && /^@(?:lapismd|lapis-notes)\/[a-z0-9._-]+$/.test(value);
const allowed = [
  "code",
  "category",
  "summary",
  "detail",
  "remediation",
  "repository",
  "sourceSha",
  "branch",
  "package",
  "path",
];

function validItem(value: unknown): value is AttentionItem {
  if (
    !object(value) ||
    Object.keys(value).some((key) => !allowed.includes(key)) ||
    !text(value.code, 64) ||
    !/^[a-z][a-z0-9-]*$/.test(value.code) ||
    !categories.has(value.category as AttentionCategory) ||
    !text(value.summary, 240) ||
    !text(value.detail) ||
    !text(value.remediation, 1000) ||
    (value.repository !== undefined &&
      (!text(value.repository, 140) || !validRepository(value.repository))) ||
    (value.sourceSha !== undefined &&
      (!text(value.sourceSha, 40) ||
        !/^[a-f0-9]{40}$/.test(value.sourceSha))) ||
    (value.branch !== undefined && !safePath(value.branch)) ||
    (value.package !== undefined && !packageName(value.package)) ||
    (value.path !== undefined && !safePath(value.path))
  )
    return false;
  return (
    value.repository !== undefined ||
    (value.sourceSha === undefined && value.branch === undefined)
  );
}

export function validAttentionEvidence(node: unknown): boolean {
  if (!object(node) || node.attention === undefined) return true;
  if (!Array.isArray(node.attention) || node.attention.length > 128)
    return false;
  try {
    if (new TextEncoder().encode(JSON.stringify(node.attention)).length > 65536)
      return false;
  } catch {
    return false;
  }
  return node.attention.every(validItem);
}

export function primaryAttention(node: WaveNode): AttentionItem | undefined {
  return node.attention?.reduce<AttentionItem | undefined>(
    (selected, item) =>
      !selected || priority[item.category] < priority[selected.category]
        ? item
        : selected,
    undefined,
  );
}

export const summaryDetails = (items: MaintenanceItem[]) =>
  new Map<string, MaintenanceDetail>(
    items.map((item) => [item.id, { item, description: "", checks: [] }]),
  );
/** A passing open PR still needs merging; successful/cancelled jobs are resolved. */
export const requiresAttention = (item: MaintenanceItem) =>
  !!item &&
  (item.kind === "pull-request" ||
    !["passed", "cancelled"].includes(item.status));
export const unverifiedItem = (
  item: MaintenanceItem,
  coverage?: RepositoryCoverage,
) =>
  !!coverage &&
  !coverage.available &&
  !(item.kind === "pull-request"
    ? coverage.inventory?.pullRequests
    : coverage.inventory?.workflows);
export const attentionSnapshot = (
  snapshot: MaintenanceSnapshot,
): MaintenanceSnapshot => ({
  ...snapshot,
  items: snapshot.items.filter(requiresAttention),
});
/** Missing rows in partial coverage are unknown, rather than confirmed resolved. */
export function preserveUnverified(
  snapshot: MaintenanceSnapshot,
  previous?: MaintenanceSnapshot,
) {
  const coverage = new Map(snapshot.repositories.map((r) => [r.repository, r]));
  const observed = new Set(snapshot.items.map((i) => i.id));
  return {
    ...snapshot,
    items: [
      ...snapshot.items,
      ...(previous?.items ?? []).filter(
        (i) =>
          unverifiedItem(i, coverage.get(i.repository)) &&
          !observed.has(i.id) &&
          requiresAttention(i),
      ),
    ],
  };
}
