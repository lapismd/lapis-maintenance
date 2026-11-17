import { execFileSync } from "node:child_process";
/** Public source identity only; credentials and the working-copy contents stay out of the bundle. */
export function buildCommit(): string {
  const configured = process.env.GITHUB_SHA;
  if (configured) {
    if (!/^[a-f0-9]{40}$/i.test(configured))
      throw new Error("GITHUB_SHA must identify a full Git commit.");
    return configured.toLowerCase();
  }
  try {
    const local = execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return /^[a-f0-9]{40}$/i.test(local) ? local.toLowerCase() : "";
  } catch {
    return "";
  }
}
