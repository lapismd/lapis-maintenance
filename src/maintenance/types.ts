/** Serializable domain contracts; adapters own all external authority and secrets. */
export type View =
  | "operations"
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
  | "enable-auto-merge"
  | "disable-auto-merge"
  | "rerun-failed"
  | "cancel-run"
  | "approve-run"
  | "approve-deployment"
  | "reject-deployment"
  | "dispatch-workflow";
export type Target =
  | {
      kind: "dispatch";
      sha: string;
      workflowId: number;
      ref: string;
      definitionSha: string;
      defaultDefinitionSha: string;
      path: string;
      name: string;
      url: string;
    }
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
  kind: "pull-request" | "workflow" | "approval";
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
  inventory?: { pullRequests: boolean; workflows: boolean };
  actions?: import("./repository-actions").RepositoryActions;
  repository: string;
  available: boolean;
  reason?: string;
  holdReason?: string;
  loading?: boolean;
}
export interface OpenIssue {
  id: number;
  number: number;
  repository: string;
  title: string;
  url: string;
  updatedAt: string;
  category: "compatibility" | "product";
}
export interface MaintenanceSnapshot {
  issues?: OpenIssue[];
  coordinator?: import("./operator-types").CoordinatorEvidence;
  items: MaintenanceItem[];
  repositories: RepositoryCoverage[];
  fetchedAt: string;
}
export interface MaintenanceDetail {
  item: MaintenanceItem;
  description: string;
  holdReason?: string;
  nodeId?: string;
  checks: {
    id?: string;
    url?: string;
    workflow?: string;
    name: string;
    state: "passed" | "failed" | "running" | "unknown";
    description?: string;
    startedAt?: string;
    completedAt?: string;
  }[];
  checksComplete?: boolean;
  review?: string;
  workflow?: string;
  environment?: string;
  ref?: string;
  baseRef?: string;
  autoMerge?: { method: "merge" | "squash" | "rebase"; enabledBy?: string };
  mergeable?: boolean;
  mergeMethods?: ("merge" | "squash" | "rebase")[];
  coverage?: string[];
  pullRequest?: MaintenanceDetail;
  workflowApprovals?: MaintenanceItem[];
}
export interface MaintenanceReadPort {
  readAutocraftReport?(
    signal: AbortSignal,
    options?: { force?: boolean },
  ): Promise<import("./autocraft-types").AutocraftEvidence>;
  readCoordinatorReport?(
    signal: AbortSignal,
    options?: { force?: boolean },
  ): Promise<import("./operator-types").CoordinatorEvidence>;
  refreshRepository(
    repository: string,
    signal: AbortSignal,
  ): Promise<MaintenanceSnapshot>;
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
    options?: {
      fresh?: boolean;
      onProgress?: (detail: MaintenanceDetail) => void;
    },
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
/** Command adapters own one fresh provider preflight; UI controllers never duplicate it. */
export interface MaintenanceCommandPort {
  execute(
    command: MaintenanceCommand,
    signal?: AbortSignal,
  ): Promise<CommandResult>;
}
export interface ActionReceipt extends CommandResult {
  command: MaintenanceCommand;
}
export class MaintenanceReadError extends Error {
  constructor(
    message: string,
    public kind: "unavailable" | "rate-limit" = "unavailable",
    public discardPreview = false,
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
