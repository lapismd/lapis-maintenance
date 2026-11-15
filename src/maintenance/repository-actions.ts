import type { RepositoryCoverage } from "./types";
export const repositoryActionLabels = {
  passed: "Succeeded",
  failed: "Failed",
  pending: "Pending",
  unknown: "Unknown",
} as const;
export type RepositoryActionState = keyof typeof repositoryActionLabels;
export interface RepositoryActions {
  branch: string;
  sha?: string;
  state: RepositoryActionState;
  workflows: number;
  reason?: string;
}
export function repositoryActionState(
  repo: RepositoryCoverage,
): RepositoryActionState {
  const state = repo.actions?.state;
  return state && Object.hasOwn(repositoryActionLabels, state)
    ? state
    : "unknown";
}
export function repositoryActionDescription(repo: RepositoryCoverage) {
  const actions = repo.actions;
  return `${actions?.branch ?? "Default branch"} Actions: ${repositoryActionLabels[repositoryActionState(repo)]}. ${actions?.reason ?? "Current branch workflow results have not been verified."}`;
}
export function filterRepositories(
  rows: RepositoryCoverage[],
  states: RepositoryActionState[],
) {
  return rows.filter(
    (row) => !states.length || states.includes(repositoryActionState(row)),
  );
}
