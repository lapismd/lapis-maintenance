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
  allow_squash_merge?: boolean;
  allow_merge_commit?: boolean;
  allow_rebase_merge?: boolean;
  permissions?: { push?: boolean; admin?: boolean; maintain?: boolean };
  archived?: boolean;
  disabled?: boolean;
}
export interface GithubPull {
  state: "open" | "closed";
  number: number;
  title: string;
  body?: string | null;
  html_url: string;
  updated_at: string;
  draft: boolean;
  node_id?: string;
  user?: { login: string };
  head: { sha: string; ref: string };
  base: { ref: string };
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
}
export interface GithubStatus {
  id: number;
  context: string;
  state: string;
  description: string | null;
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
  /^[a-zA-Z0-9][\w.-]*\/[a-zA-Z0-9][\w.-]*$/.test(value);
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
