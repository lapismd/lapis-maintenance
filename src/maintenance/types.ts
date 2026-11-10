/** Serializable domain contracts; adapters own all external authority and secrets. */
export type View =
  | "inbox"
  | "activity"
  | "pull-request"
  | "workflow"
  | "approval";
export type ItemStatus =
  | "approval-wait"
  | "failed"
  | "review-needed"
  | "blocked"
  | "draft"
  | "running"
  | "cancelled"
  | "unavailable"
  | "passed";
export type ActionKind =
  | "mark-ready"
  | "approve-pr"
  | "request-changes"
  | "comment"
  | "merge-pr"
  | "rerun-failed"
  | "cancel-run"
  | "approve-run"
  | "approve-deployment"
  | "reject-deployment"
  | "dispatch-workflow";
export type Target =
  | { kind: "pull-request"; sha: string }
  | { kind: "workflow"; sha: string; runId: number; attempt: number }
  | {
      kind: "deployment";
      sha: string;
      runId: number;
      environmentId: number;
      attempt?: number;
    };
export interface ActionCapability {
  kind: ActionKind;
  label: string;
  available: boolean;
  reason?: string;
}
export interface MaintenanceItem {
  id: string;
  repository: string;
  title: string;
  number?: number;
  kind: Exclude<View, "inbox" | "activity">;
  status: ItemStatus;
  category:
    | "dependency"
    | "compatibility"
    | "versioning"
    | "registry"
    | "product"
    | "release";
  updatedAt: string;
  url: string;
  reasons: string[];
  draft?: boolean;
  target: Target;
  actions: ActionCapability[];
}
export interface RepositoryCoverage {
  repository: string;
  available: boolean;
  reason?: string;
  holdReason?: string;
  loading?: boolean;
}
export interface MaintenanceSnapshot {
  items: MaintenanceItem[];
  repositories: RepositoryCoverage[];
  fetchedAt: string;
}
export interface MaintenanceDetail {
  item: MaintenanceItem;
  description: string;
  checks: {
    name: string;
    state: "passed" | "failed" | "running" | "unknown";
    description?: string;
  }[];
  review?: string;
  workflow?: string;
  environment?: string;
  ref?: string;
  baseRef?: string;
  mergeable?: boolean;
  mergeMethods?: ("merge" | "squash" | "rebase")[];
  coverage?: string[];
  pullRequest?: MaintenanceDetail;
  workflowApprovals?: MaintenanceItem[];
}
export interface MaintenanceReadPort {
  readSnapshot(
    signal: AbortSignal,
    options?: {
      force?: boolean;
      onProgress?: (snapshot: MaintenanceSnapshot) => void;
    },
  ): Promise<MaintenanceSnapshot>;
  readDetails(
    itemId: string,
    signal: AbortSignal,
    options?: { fresh?: boolean },
  ): Promise<MaintenanceDetail>;
}
export interface CommandInputs {
  body?: string;
  mergeMethod?: "merge" | "squash" | "rebase";
  ref?: string;
  workflowInputs?: Record<string, string>;
}
export interface MaintenanceCommand {
  requestId: string;
  itemId: string;
  repository: string;
  target: Target;
  kind: ActionKind;
  inputs: CommandInputs;
}
export interface CommandResult {
  status: "completed" | "accepted" | "rejected" | "uncertain";
  message: string;
  url?: string;
}
export interface MaintenanceCommandPort {
  execute(command: MaintenanceCommand): Promise<CommandResult>;
}
export interface ActionReceipt extends CommandResult {
  command: MaintenanceCommand;
}
export class MaintenanceReadError extends Error {
  constructor(
    message: string,
    public kind: "unavailable" | "rate-limit" = "unavailable",
  ) {
    super(message);
  }
}
export const statusLabels: Record<ItemStatus, string> = {
  "approval-wait": "Approval waiting",
  failed: "Failed",
  "review-needed": "Review requested",
  blocked: "Blocked",
  draft: "Draft",
  running: "Running",
  cancelled: "Cancelled",
  passed: "Checks passed",
  unavailable: "Data unavailable",
};
export const targetKey = (target: Target): string => JSON.stringify(target);
