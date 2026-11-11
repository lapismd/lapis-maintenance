/* App-owned worker: only build-listed public assets may enter CacheStorage. */
const config = __PWA_CONFIG__;
const prefix = "lapis-maintenance-assets-";
const cacheName = `${prefix}${config.version}`;
const urls = new Set(
  config.assets.map((asset) => new URL(asset, self.location).href),
);
const shell = new URL("index.html", self.registration.scope).href;
const root = self.registration.scope;
const assetRoot = new URL("assets/", root).href;
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(cacheName);
        for (const url of urls) {
          const response = await fetch(url, {
            credentials: "omit",
            cache: "reload",
          });
          if (!response.ok || response.type === "opaque")
            throw new Error("Asset precache failed");
          await cache.put(url, response);
        }
      } catch (error) {
        await caches.delete(cacheName);
        throw error;
      }
    })(),
  );
});
async function pruneCaches(navigatingClients = []) {
  if (self.registration.installing || self.registration.waiting) return;
  const clients = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });
  if (clients.some((client) => !navigatingClients.includes(client.id))) return;
  for (const name of await caches.keys()) {
    if (name.startsWith(prefix) && name !== cacheName)
      await caches.delete(name);
  }
}
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await pruneCaches();
      await self.clients.claim();
    })(),
  );
});
self.addEventListener("message", (event) => {
  if (event.data?.type === "ACTIVATE_UPDATE")
    event.waitUntil(self.skipWaiting());
});
function isolated(response) {
  const headers = new Headers(response.headers);
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("Cross-Origin-Embedder-Policy", "credentialless");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
async function asset(request) {
  const current = await caches.open(cacheName);
  let cached = await current.match(request.url);
  // Assets of older open tabs are immutable and were also build-listed.
  if (!cached)
    for (const name of await caches.keys()) {
      if (name.startsWith(prefix))
        cached = await (await caches.open(name)).match(request.url);
      if (cached) break;
    }
  return isolated(cached || (await fetch(request)));
}
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (
    request.method !== "GET" ||
    request.headers.has("Authorization") ||
    url.search ||
    url.origin !== self.location.origin
  )
    return;
  const navigation =
    request.mode === "navigate" && [root, shell].includes(url.href);
  if (navigation) {
    // A navigating tab no longer needs its old assets; other open tabs still do.
    event.waitUntil(pruneCaches([event.clientId, event.resultingClientId]));
    event.respondWith(
      (async () => {
        try {
          return isolated(await fetch(request));
        } catch {
          const cached = await (await caches.open(cacheName)).match(shell);
          if (!cached) throw new Error("Offline shell unavailable");
          return isolated(cached);
        }
      })(),
    );
  } else if (urls.has(url.href) || url.href.startsWith(assetRoot)) {
    event.respondWith(asset(request));
  }
});
