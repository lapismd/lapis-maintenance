import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".wasm": "application/wasm",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".json": "application/json",
};
export async function servePwa(initialRoot) {
  let root = path.resolve(initialRoot);
  let workerDelay = 0;
  const server = createServer(async (request, response) => {
    const url = new URL(request.url, "http://localhost");
    const relative = decodeURIComponent(url.pathname).replace(
      /^\/lapis-maintenance\//,
      "",
    );
    const file = path.resolve(root, relative || "index.html");
    if (
      !url.pathname.startsWith("/lapis-maintenance/") ||
      !file.startsWith(`${root}/`)
    ) {
      response.writeHead(404).end();
      return;
    }
    try {
      if (url.pathname.endsWith("/service-worker.js") && workerDelay)
        await new Promise((resolve) => setTimeout(resolve, workerDelay));
      const data = await readFile(file);
      response.writeHead(200, {
        "Content-Type": types[path.extname(file)] || "application/octet-stream",
        "Cache-Control": "no-store",
      });
      response.end(data);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    url: `http://127.0.0.1:${server.address().port}/lapis-maintenance/`,
    root: (value) => {
      root = path.resolve(value);
    },
    delayWorker: (value) => {
      workerDelay = value;
    },
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
