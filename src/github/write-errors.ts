/** Bounded GitHub diagnostics; never include request headers or credentials. */
export async function writeFailure(
  response: Response,
  path: string,
): Promise<string> {
  let message = "";
  try {
    const body = await response.json();
    if (typeof body?.message === "string")
      message = body.message.replace(/[\x00-\x1f]/g, " ").slice(0, 500);
  } catch {
    /* The status still provides a definite rejection. */
  }
  const accepted = response.headers
    .get("x-accepted-github-permissions")
    ?.slice(0, 200);
  const scope = accepted
    ? ` Required token permissions: ${accepted}.`
    : /\/actions\//.test(path)
      ? " Check Actions permissions and the identified workflow or environment reviewer eligibility."
      : " Check Pull requests/Contents permissions and repository rules.";
  return `GitHub rejected the action (HTTP ${response.status})${message ? `: ${message}` : "."}${scope}`;
}
