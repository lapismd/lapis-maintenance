export interface GithubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
}
export interface GithubRepository {
  full_name: string;
  default_branch: string;
  allow_auto_merge?: boolean;
  allow_squash_merge?: boolean;
  allow_merge_commit?: boolean;
  allow_rebase_merge?: boolean;
  permissions?: { push?: boolean; admin?: boolean; maintain?: boolean };
  archived?: boolean;
  disabled?: boolean;
  private?: boolean;
}
export interface GithubPull {
  state: "open" | "closed";
  merged_at?: string | null;
  auto_merge?: {
    merge_method: "merge" | "squash" | "rebase";
    enabled_by?: { login: string };
  } | null;
  additions?: number;
  deletions?: number;
  number: number;
  title: string;
  body?: string | null;
  html_url: string;
  updated_at: string;
  draft: boolean;
  node_id?: string;
  user?: { login: string; avatar_url?: string };
  head: {
    sha: string;
    ref: string;
    repo?: { full_name: string; private: boolean; fork?: boolean } | null;
  };
  base: { ref: string; repo?: { full_name: string; private: boolean } | null };
  labels: { name: string }[];
  requested_reviewers?: { login: string }[];
  mergeable_state?: string;
  mergeable?: boolean | null;
}
export interface GithubCheck {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  head_sha: string;
  output?: { title?: string; summary?: string };
  html_url?: string;
  details_url?: string;
  started_at?: string | null;
  completed_at?: string | null;
}
export interface GithubStatus {
  id: number;
  context: string;
  state: string;
  description: string | null;
  target_url?: string | null;
}
export interface GithubReview {
  id: number;
  state: string;
  commit_id: string;
  submitted_at: string;
  user: { login: string };
}
export interface GithubRun {
  event?: string;
  id: number;
  workflow_id: number;
  name: string;
  display_title: string;
  html_url: string;
  head_sha: string;
  head_branch: string;
  run_attempt: number;
  status: string;
  conclusion: string | null;
  updated_at: string;
  pull_requests: { number: number }[];
}
export interface GithubEnvironment {
  environment: { id: number; name: string };
  current_user_can_approve: boolean;
  wait_timer: number;
  wait_timer_started_at?: string | null;
  reviewers: { type: string; reviewer: { login?: string; name?: string } }[];
}
export interface RepositorySelection {
  additions: string[];
  exclusions: string[];
}
export interface RepositoryDefault {
  repository: string;
  holdReason?: string;
}
export const validRepository = (value: string): boolean =>
  /^[a-zA-Z0-9][\w.-]*\/(?!(?:\.|\.\.)$)[\w.-]+$/.test(value);
export function category(
  title: string,
  repository: string,
  labels: string[] = [],
) {
  if (/compatib/i.test(title)) return "compatibility" as const;
  if (/depend|\bdeps\b/i.test([title, ...labels].join(" ")))
    return "dependency" as const;
  if (/version|changeset/i.test(title)) return "versioning" as const;
  if (/registry/.test(repository)) return "registry" as const;
  if (/release|publish/i.test(title)) return "release" as const;
  return "product" as const;
}
