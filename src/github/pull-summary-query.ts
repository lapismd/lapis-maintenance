import type { GithubPull, GithubReview, GithubStatus } from "./models";
export interface PullSummaryNode {
  id: string;
  number: number;
  title: string;
  body: string;
  url: string;
  updatedAt: string;
  isDraft: boolean;
  headRefOid: string;
  mergeable: string;
  mergeStateStatus: string;
  author?: { login: string; avatarUrl?: string } | null;
  commits?: {
    nodes: {
      commit?: {
        oid: string;
        statusCheckRollup?: {
          contexts: {
            nodes: SummaryContext[];
            pageInfo: { hasNextPage: boolean };
          };
        } | null;
      };
    }[];
  };
  reviews?: {
    nodes: {
      databaseId: number;
      state: string;
      submittedAt: string;
      author?: { login: string } | null;
      commit?: { oid: string } | null;
    }[];
    pageInfo: { hasPreviousPage: boolean };
  };
}
export interface SummaryContext {
  __typename: "CheckRun" | "StatusContext";
  databaseId?: number;
  name?: string;
  status?: string;
  conclusion?: string;
  detailsUrl?: string;
  context?: string;
  state?: string;
  description?: string;
  targetUrl?: string;
  createdAt?: string;
}
export function summaryQuery(pulls: GithubPull[]) {
  const declarations = pulls.map((_, index) => `$n${index}:Int!`).join(",");
  const fields = pulls
    .map(
      (_, index) => `p${index}:pullRequest(number:$n${index}){
    id number title body url updatedAt isDraft headRefOid mergeable mergeStateStatus author{login avatarUrl}
    commits(last:1){nodes{commit{oid statusCheckRollup{contexts(first:100){nodes{__typename ...on CheckRun{databaseId name status conclusion detailsUrl} ...on StatusContext{context state description targetUrl createdAt}}pageInfo{hasNextPage}}}}}}
    reviews(last:100){nodes{databaseId state submittedAt author{login} commit{oid}}pageInfo{hasPreviousPage}}
  }`,
    )
    .join("\n");
  return `query MaintenanceInventory($owner:String!,$name:String!,${declarations}){repository(owner:$owner,name:$name){${fields}}}`;
}
export function summaryPull(pr: GithubPull, node: PullSummaryNode): GithubPull {
  return {
    ...pr,
    node_id: node.id,
    number: node.number,
    title: node.title,
    body: node.body,
    html_url: node.url,
    updated_at: node.updatedAt,
    draft: node.isDraft,
    head: { ...pr.head, sha: node.headRefOid },
    user: node.author
      ? { login: node.author.login, avatar_url: node.author.avatarUrl }
      : pr.user,
    mergeable:
      node.mergeable === "MERGEABLE"
        ? true
        : node.mergeable === "CONFLICTING"
          ? false
          : null,
    mergeable_state: node.mergeStateStatus?.toLowerCase(),
  };
}
export const summaryStatuses = (contexts: SummaryContext[]): GithubStatus[] =>
  contexts
    .filter((c) => c.__typename === "StatusContext")
    .map((c, index) => ({
      id: Date.parse(c.createdAt ?? "") || index,
      context: c.context!,
      state: c.state!.toLowerCase(),
      description: c.description ?? null,
      target_url: c.targetUrl,
    }));
export const summaryReviews = (node: PullSummaryNode): GithubReview[] =>
  (node.reviews?.nodes ?? []).map((review, index) => ({
    id: review.databaseId ?? index,
    state: review.state,
    commit_id: review.commit?.oid ?? "",
    submitted_at: review.submittedAt,
    user: { login: review.author?.login ?? "deleted-user" },
  }));
