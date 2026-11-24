import { parseAutocraftReport, autocraftUnavailable } from "./autocraft-schema";
import {
  GithubError,
  type GithubTransport,
  type ReadOptions,
} from "./transport";
import type { AutocraftEvidence } from "../maintenance/autocraft-types";
const root = "/repos/lapismd/lapis-autocraft";
const sha = (v: unknown): v is string =>
  typeof v === "string" && /^[a-f0-9]{40}$/.test(v);
export async function readAutocraftReport(
  client: GithubTransport,
  signal: AbortSignal,
  options: ReadOptions,
  now = Date.now(),
): Promise<AutocraftEvidence> {
  try {
    // Raw report/config bytes stay out of the response cache. Only validated projection is retained.
    const fresh = { ...options, fresh: true };
    const [ref, main] = await Promise.all([
      client.read<{ object: { sha: string } }>(
        root + "/git/ref/heads/automation/operations-state",
        signal,
        fresh,
      ),
      client.read<{ object: { sha: string } }>(
        root + "/git/ref/heads/main",
        signal,
        fresh,
      ),
    ]);
    if (!sha(ref?.object?.sha) || !sha(main?.object?.sha))
      return autocraftUnavailable();
    const raw = { ...fresh, accept: "application/vnd.github.raw+json" };
    const [value, policy] = await Promise.all([
      client.read<unknown>(
        root + "/contents/report.json?ref=" + ref.object.sha,
        signal,
        raw,
      ),
      client.read<unknown>(
        root + "/contents/config/operations.json?ref=" + main.object.sha,
        signal,
        raw,
      ),
    ]);
    const decoded = typeof value === "string" ? JSON.parse(value) : value;
    const digest = Array.from(
      new Uint8Array(
        await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(
            JSON.stringify(
              typeof policy === "string" ? JSON.parse(policy) : policy,
            ),
          ),
        ),
      ),
      (b) => b.toString(16).padStart(2, "0"),
    ).join("");
    const evidence = parseAutocraftReport(decoded, digest, now);
    if (evidence.report) {
      const compare = await client.read<{ status: string }>(
        `${root}/compare/${evidence.report.sourceRevision}...${main.object.sha}`,
        signal,
        fresh,
      );
      if (!["ahead", "identical"].includes(compare.status))
        return autocraftUnavailable();
    }
    return { ...evidence, sourceRevision: ref.object.sha };
  } catch (error) {
    signal.throwIfAborted();
    if (error instanceof GithubError && error.status === 401) throw error;
    return autocraftUnavailable();
  }
}
