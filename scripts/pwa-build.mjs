import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
async function files(root, relative = "") {
  const entries = await readdir(path.join(root, relative), {
    withFileTypes: true,
  });
  return (
    await Promise.all(
      entries.map((entry) => {
        const name = path.posix.join(relative, entry.name);
        return entry.isDirectory()
          ? name === "storybook"
            ? []
            : files(root, name)
          : name;
      }),
    )
  ).flat();
}
/** Inventory is generated before fixture Storybook is assembled into Pages. */
export async function buildPwa(root, base = "/lapis-maintenance/") {
  const index = await readFile(path.join(root, "index.html"), "utf8");
  if (!index.includes('name="application-name" content="Lapis Maintenance"'))
    return;
  const source = await readFile(
    new URL("../src/pwa/worker.template.mjs", import.meta.url),
    "utf8",
  );
  const inventory = (await files(root))
    .filter(
      (file) =>
        !["service-worker.js", "coi-serviceworker.js"].includes(file) &&
        /\.(?:html|js|css|wasm|png|svg|woff2?|ttf|otf|webmanifest)$/.test(file),
    )
    .sort();
  const hash = createHash("sha256").update(source).update(base);
  for (const file of inventory)
    hash.update(file).update(await readFile(path.join(root, file)));
  const version = hash.digest("hex").slice(0, 20);
  const config = { version, assets: inventory.map((file) => `${base}${file}`) };
  await writeFile(
    path.join(root, "service-worker.js"),
    source.replace("__PWA_CONFIG__", JSON.stringify(config)),
  );
  return config;
}
