import { test, expect, type Page } from "playwright/test";
import { cp, mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { servePwa } from "./pwa-server.mjs";
import { buildPwa } from "../scripts/pwa-build.mjs";
let server: Awaited<ReturnType<typeof servePwa>>;
let directory: string;
const credentialKey = "lapis-maintenance:session:v1";
async function ready(page: Page) {
  await page.goto(server.url);
  await expect(
    page.getByRole("heading", { name: "Lapis Maintenance" }),
  ).toBeVisible();
  await expect.poll(() => page.evaluate(() => crossOriginIsolated)).toBe(true);
  await expect
    .poll(() =>
      page.evaluate(async () =>
        Boolean((await navigator.serviceWorker.ready).active),
      ),
    )
    .toBe(true);
}
test.beforeAll(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "maintenance-pwa-"));
  await cp("dist", path.join(directory, "a"), { recursive: true });
  await cp("dist", path.join(directory, "b"), { recursive: true });
  const index = path.join(directory, "b/index.html");
  await writeFile(
    index,
    (await readFile(index, "utf8")).replace(
      "</head>",
      '<meta name="test-version" content="b"></head>',
    ),
  );
  await writeFile(
    path.join(directory, "a/assets/older-tab-only.js"),
    "/* Older tab asset */",
  );
  await buildPwa(path.join(directory, "a"));
  await buildPwa(path.join(directory, "b"));
  await writeFile(
    path.join(directory, "a/bootstrap.html"),
    "<!doctype html><title>Legacy migration</title>",
  );
  await writeFile(
    path.join(directory, "a/coi-serviceworker.js"),
    `self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
     self.addEventListener("fetch", e => {
       if (new URL(e.request.url).origin !== self.location.origin) return;
       e.respondWith(fetch(e.request).then(r => {
         const headers = new Headers(r.headers);
         headers.set("Cross-Origin-Opener-Policy", "same-origin");
         headers.set("Cross-Origin-Embedder-Policy", "credentialless");
         return new Response(r.body, { status: r.status, headers });
       }));
     });`,
  );
  server = await servePwa(path.join(directory, "a"));
});
test.afterAll(async () => {
  await server.close();
  await rm(directory, { recursive: true, force: true });
});
test.beforeEach(() => {
  server.root(path.join(directory, "a"));
  server.delayWorker(0);
});
test("publishes an installable manifest under the Pages base", async ({
  page,
}) => {
  await ready(page);
  const manifestLink = page.locator('link[rel="manifest"]');
  await expect(manifestLink).toHaveCount(1);
  const href = await manifestLink.getAttribute("href");
  const response = await page.request.get(new URL(href!, server.url).href);
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest.display).toBe("standalone");
  expect(new URL(manifest.scope, response.url()).pathname).toBe(
    "/lapis-maintenance/",
  );
  expect(new URL(manifest.start_url, response.url()).href).toBe(
    `${server.url}#inbox`,
  );
  for (const icon of manifest.icons) {
    const dimensions = await page.evaluate(async (url) => {
      const image = new Image();
      image.src = url;
      await image.decode();
      return `${image.naturalWidth}x${image.naturalHeight}`;
    }, new URL(icon.src, response.url()).href);
    expect(dimensions).toBe(icon.sizes);
  }
  const cdp = await page.context().newCDPSession(page);
  await expect
    .poll(
      async () =>
        (await cdp.send("Page.getInstallabilityErrors")).installabilityErrors,
    )
    .toEqual([]);
});
test("cold offline reload shows reconnect without restoring a saved account", async ({
  page,
  context,
}) => {
  await ready(page);
  await page.evaluate(
    ([key, token]) =>
      localStorage.setItem(key, JSON.stringify({ version: 1, token })),
    [credentialKey, "invented-offline-token"],
  );
  let githubRequests = 0;
  page.on("request", (request) => {
    if (request.url().startsWith("https://api.github.com/")) githubRequests++;
  });
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "You’re offline" }),
  ).toBeVisible();
  await expect(page.getByLabel("GitHub token", { exact: true })).toHaveCount(0);
  expect(githubRequests).toBe(0);
  await expect(page.getByRole("button", { name: "Reconnect" })).toBeVisible();
  await context.route("https://api.github.com/**", (route) =>
    route.fulfill({ status: 401, json: { message: "Rejected fake token" } }),
  );
  await context.setOffline(false);
  await expect(page.getByLabel("GitHub token", { exact: true })).toBeVisible();
  expect(githubRequests).toBe(1);
});
test("CacheStorage contains only listed public assets, never API data or credentials", async ({
  page,
  context,
}) => {
  await ready(page);
  await context.route("https://api.github.com/**", (route) =>
    route.fulfill({ json: { private: "invented-private-repository-data" } }),
  );
  await context.route("**/storybook/index.html", (route) =>
    route.fulfill({ body: "fixture-storybook" }),
  );
  await page.evaluate(async () => {
    await fetch("https://api.github.com/user", {
      headers: { Authorization: "Bearer invented-cache-test-token" },
    });
    await fetch("./storybook/index.html");
    await fetch("./manifest.webmanifest?private=invented-query");
  });
  const entries = await page.evaluate(async () => {
    const result = [];
    for (const name of await caches.keys()) {
      if (!name.startsWith("lapis-maintenance-assets-")) continue;
      for (const request of await (await caches.open(name)).keys())
        result.push({
          url: request.url,
          authorization: request.headers.get("Authorization"),
        });
    }
    return result;
  });
  expect(entries.length).toBeGreaterThan(5);
  for (const entry of entries) {
    expect(entry.url.startsWith(server.url)).toBe(true);
    expect(entry.url).not.toMatch(/storybook|api.github|invented|\?/);
    expect(entry.authorization).toBeNull();
  }
});
test("a waiting update preserves the form until explicit reload", async ({
  page,
}) => {
  await ready(page);
  const olderTab = await page.context().newPage();
  await ready(olderTab);
  await page
    .getByLabel("GitHub token", { exact: true })
    .fill("invented-unsent-token");
  const initialWorker = await page.evaluate(
    async () => await (await navigator.serviceWorker.ready).active!.scriptURL,
  );
  server.root(path.join(directory, "b"));
  await page.evaluate(async () => {
    await (await navigator.serviceWorker.ready).update();
  });
  await expect(
    page.getByRole("button", { name: "Reload update" }),
  ).toBeVisible();
  await expect(page.getByLabel("GitHub token", { exact: true })).toHaveValue(
    "invented-unsent-token",
  );
  await expect(page.locator('meta[name="test-version"]')).toHaveCount(0);
  expect(
    await page.evaluate(() => navigator.serviceWorker.controller!.scriptURL),
  ).toBe(initialWorker);
  await page.getByRole("button", { name: "Reload update" }).click();
  await expect(page.locator('meta[name="test-version"]')).toHaveAttribute(
    "content",
    "b",
  );
  await expect(page.getByLabel("GitHub token", { exact: true })).toHaveValue(
    "",
  );
  await olderTab.close();
  await page.reload();
  await expect
    .poll(() =>
      page.evaluate(
        async () =>
          (await caches.keys()).filter((name) =>
            name.startsWith("lapis-maintenance-assets-"),
          ).length,
      ),
    )
    .toBe(1);
});
test("migrates the existing isolation worker without leaving an update prompt", async ({
  page,
}) => {
  await page.goto(`${server.url}bootstrap.html`);
  await page.evaluate(async () => {
    await navigator.serviceWorker.register("./coi-serviceworker.js");
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() =>
      page.evaluate(() => navigator.serviceWorker.controller?.scriptURL ?? ""),
    )
    .toContain("/coi-serviceworker.js");
  await ready(page);
  await expect
    .poll(() =>
      page.evaluate(() => navigator.serviceWorker.controller?.scriptURL ?? ""),
    )
    .toContain("/service-worker.js");
  await expect(page.getByRole("button", { name: "Reload update" })).toHaveCount(
    0,
  );
});
test("hash navigation and reload retain the selected view", async ({
  page,
  context,
}) => {
  await ready(page);
  await context.route("https://api.github.com/**", (route) => {
    const url = new URL(route.request().url());
    const data =
      url.pathname === "/user"
        ? {
            id: 987654321,
            login: "pwa-maintainer",
            name: "PWA Maintainer",
            avatar_url: "",
          }
        : url.pathname.endsWith("/repositories.json")
          ? { repositories: [] }
          : url.pathname.endsWith("/pulls")
            ? []
            : url.pathname.endsWith("/actions/runs")
              ? { workflow_runs: [] }
              : {
                  full_name: "lapismd/dependency-automation",
                  default_branch: "main",
                };
    return route.fulfill({ json: data });
  });
  await page
    .getByLabel("GitHub token", { exact: true })
    .fill("invented-pwa-login-token");
  await page.getByRole("button", { name: "Connect GitHub" }).click();
  await page.getByRole("button", { name: "Activity", exact: true }).click();
  await expect(page).toHaveURL(`${server.url}#activity`);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Activity", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page.getByRole("button", { name: "Inbox", exact: true }).click();
  await expect(page).toHaveURL(`${server.url}#inbox`);
  await page.goBack();
  await expect(
    page.getByRole("button", { name: "Activity", exact: true }),
  ).toHaveAttribute("aria-current", "page");
});

test("delayed worker registration bounds login startup and preserves unsent input", async ({
  page,
}) => {
  server.delayWorker(9000);
  await page.goto(server.url, { waitUntil: "domcontentloaded" });
  const input = page.getByLabel("GitHub token", { exact: true });
  await expect(input).toBeVisible({ timeout: 5000 });
  await input.fill("invented-unsent-during-install");
  await expect
    .poll(
      () =>
        page.evaluate(
          () => navigator.serviceWorker.controller?.scriptURL ?? "",
        ),
      { timeout: 15000 },
    )
    .toContain("/service-worker.js");
  await expect(input).toHaveValue("invented-unsent-during-install");
});
