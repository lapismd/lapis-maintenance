import type { CommandResult } from "../types";
export type ReviewTab = "overview" | "checks" | "activity";
export interface ReviewOverview {
  id: string;
  kind: "pull-request" | "workflow" | "approval";
  repository: string;
  number: number;
  title: string;
  url: string;
  author: string;
  sha: string;
  head: string;
  base: string;
  description: string;
  labels: string[];
  review: string;
  draft: boolean;
  state: "open" | "merged" | "closed";
  target?: import("../types").Target;
  mergeMethods?: ("merge" | "squash" | "rebase")[];
  mergeReason?: string;
  autoMerge?: import("../types").MaintenanceDetail["autoMerge"];
  linkedPull?: ReviewOverview;
  actions?: import("../types").ActionCapability[];
  canReview: boolean;
  actionReason?: string;
  /** Merge permission; GitHub remains authoritative for repository rules. */
  canMerge: boolean;
  additions: number;
  deletions: number;
}
export interface ReviewCheck {
  id: string;
  name: string;
  workflow: string;
  sha?: string;
  state: "passed" | "failed" | "running" | "queued" | "unknown";
  description: string;
  url?: string;
}
export interface ReviewApproval {
  id: string;
  kind: "workflow" | "environment";
  title: string;
  url: string;
  runId: number;
  attempt: number;
  sha: string;
  environment?: string;
  state: "ready" | "checking" | "denied" | "waiting" | "accepted" | "uncertain";
  reason: string;
  reviewers?: string[];
  permission: string;
  target?: import("../types").Target;
}
export interface ReviewEvent {
  id: string;
  kind: "comment" | "review" | "commit" | "deployment";
  actor: string;
  avatarUrl?: string;
  outcome?: "success" | "failure";
  title: string;
  body: string;
  time: string;
  url: string;
}
export interface ReviewPage {
  items: ReviewEvent[];
  next?: string;
}
export interface ReviewResources {
  overview: ReviewOverview;
  checks: ReviewCheck[];
  approvals: ReviewApproval[];
  activity: ReviewPage;
}
export type ReviewResource = keyof ReviewResources;
export type ResourceState<T> = { data?: T; loading: boolean; error?: string };
export type ReviewState = {
  [K in ReviewResource]: ResourceState<ReviewResources[K]>;
};
export type ReviewAction =
  | "approve-pr"
  | "merge-pr"
  | "enable-auto-merge"
  | "disable-auto-merge"
  | "approve-workflow"
  | "approve-environment"
  | "reject-environment"
  | "mark-ready"
  | "request-changes"
  | "comment"
  | "rerun-failed"
  | "cancel-run";
export interface ReviewCommand {
  repository?: string;
  requestId: string;
  itemId: string;
  targetId: string;
  sha: string;
  kind: ReviewAction;
  label: string;
  runId?: number;
  attempt?: number;
  environment?: string;
  comment?: string;
  target?: import("../types").Target;
  mergeMethod?: "merge" | "squash" | "rebase";
}
/** Hosts own construction, credentials/effects and disposal. No provider code enters presentation. */
export interface ReviewReadPort {
  preview?(id: string): Partial<ReviewResources>;
  accepts?(id: string): boolean;
  read<K extends ReviewResource>(
    id: string,
    resource: K,
    signal: AbortSignal,
    options?: {
      cursor?: string;
      force?: boolean;
      onProgress?: (value: ReviewResources[K]) => void;
    },
  ): Promise<ReviewResources[K]>;
}
export interface ReviewCommandPort {
  execute(command: ReviewCommand, signal: AbortSignal): Promise<CommandResult>;
}
export const emptyReviewState = (): ReviewState => ({
  overview: { loading: false },
  checks: { loading: false },
  approvals: { loading: false },
  activity: { loading: false },
});
