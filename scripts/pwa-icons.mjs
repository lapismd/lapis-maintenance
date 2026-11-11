import { Resvg } from "@resvg/resvg-js";
import { readFile, writeFile, mkdir } from "node:fs/promises";
const logo = await readFile("src/assets/lapis-logo.svg", "utf8");
const body = logo.replace(/^.*?<svg[^>]*>/s, "").replace(/<\/svg>\s*$/, "");
const viewBox = logo.match(/viewBox="([^"]+)"/)?.[1] ?? "0 0 1024 1024";
await mkdir("public/icons", { recursive: true });
for (const size of [180, 192, 512]) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100"><rect width="100" height="100" fill="#fafafa"/><svg x="20" y="20" width="60" height="60" viewBox="${viewBox}">${body}</svg></svg>`;
  await writeFile(
    `public/icons/${size === 180 ? "apple-touch-icon" : `icon-${size}`}.png`,
    new Resvg(svg).render().asPng(),
  );
}
await writeFile("public/icons/lapis.svg", logo);
