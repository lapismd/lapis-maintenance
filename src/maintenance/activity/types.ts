import type { ItemStatus } from "../types";
export const activityKinds = {
  "pull-request": "Pull requests",
  review: "Reviews",
  check: "Checks",
  workflow: "Workflows",
  deployment: "Deployments",
  comment: "Comments",
  commit: "Commits",
} as const;
export type ActivityKind = keyof typeof activityKinds;
export interface ActivityEntryContent {
  id: string;
  actor: string;
  avatarUrl?: string;
  title: string;
  body: string;
  time: string;
  url: string;
  outcome?: "success" | "failure";
}
export interface ActivityEvent extends ActivityEntryContent {
  repository: string;
  itemId: string;
  status: ItemStatus;
  createdAt: string;
  kind: ActivityKind;
}
export interface ActivityQuery {
  search: string;
  repositories: string[];
  repositoriesRestricted?: boolean;
  statuses: ItemStatus[];
  kinds: ActivityKind[];
}
export interface ActivityPage {
  events: ActivityEvent[];
  nextCursor?: string;
  total: number;
  totalKnown?: boolean;
  coverage?: string[];
}
/** Query-scoped, read-only cursor pages. Hosts own transport and disposal. */
export interface ActivityReadPort {
  readPage(
    query: ActivityQuery,
    cursor: string | undefined,
    signal: AbortSignal,
    options?: { force?: boolean },
  ): Promise<ActivityPage>;
}
