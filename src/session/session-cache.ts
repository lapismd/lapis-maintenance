import { openResponseCache } from "../cache/turso-cache";
import { sessionPartition } from "./session-identity";
import type { GithubUser } from "../github/models";
export async function openSessionCache(
  identity: GithubUser,
  token: string,
  open: typeof openResponseCache | undefined,
  current: () => boolean,
  onFallback: () => void,
) {
  const result = await (open ?? openResponseCache)(
    await sessionPartition(identity, token),
    onFallback,
  );
  if (!current()) {
    await result.cache.close();
    throw new Error("Session replaced");
  }
  return result;
}
