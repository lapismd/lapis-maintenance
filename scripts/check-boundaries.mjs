import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) =>
        entry.isDirectory()
          ? files(path.join(dir, entry.name))
          : path.join(dir, entry.name),
      ),
    )
  ).flat();
}
const findings = [];
for (const file of [
  ...(await files("src")),
  ...(await files("catalog")),
  ...(await files("scripts")),
]) {
  if (!/\.(?:ts|svelte|css|mjs)$/.test(file)) continue;
  const text = await readFile(file, "utf8");
  const limit = file.endsWith(".test.ts")
    ? 500
    : file.startsWith("catalog/")
      ? 400
      : 300;
  const lines = text.split("\n").filter((line) => line.trim()).length;
  if (lines > limit)
    findings.push(`${file}: ${lines} nonblank lines exceeds ${limit}`);
  if (!file.startsWith("src/") && !file.startsWith("catalog/")) continue;
  if (file.endsWith(".test.ts")) continue;
  if (
    file.startsWith("src/") &&
    /(?:from\s*["'][^"']*catalog\/|import\s*\(["'][^"']*catalog\/)/.test(text)
  )
    findings.push(`${file}: production imports catalog`);
  if (
    /\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(|\b(?:localStorage|sessionStorage|indexedDB|serviceWorker)\s*\./.test(
      text,
    )
  )
    findings.push(
      `${file}: Slice 1 permits no live transport or browser persistence`,
    );
  if (/globalThis\s*\.\s*app\b/.test(text))
    findings.push(`${file}: ambient App ownership`);
}
if (findings.length) throw new Error(findings.join("\n"));
console.log(
  "Source boundaries and file budgets passed; Slice 1 is in-memory only.",
);
