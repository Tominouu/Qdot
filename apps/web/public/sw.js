/*
 * Qdot service worker.
 *
 * - Hashed build assets (/_next/static) and PWA images: cache-first (they never change).
 * - Pages: always from the network (they're per-user and per-language); when the
 *   network is down, a self-contained offline page is shown instead.
 * - The API (another origin), non-GET requests and React Server Component
 *   payloads are never touched.
 *
 * Registered as /sw.js?v=<build id>: every deploy installs a new worker, the page
 * offers to reload, and old caches are dropped on activation.
 */
const VERSION = new URL(self.location.href).searchParams.get("v") || "dev";
const STATIC_CACHE = `qdot-static-${VERSION}`;
const SHELL_CACHE = `qdot-shell-${VERSION}`;
const OFFLINE_URL = "/offline.html";
const SHELL = [OFFLINE_URL, "/pwa/icon-192.png", "/pwa/icon-512.png", "/favicon.ico"];
const MAX_STATIC_ENTRIES = 250;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL)));
  // No skipWaiting here: the page asks the user before switching versions.
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([STATIC_CACHE, SHELL_CACHE]);
      for (const key of await caches.keys()) if (key.startsWith("qdot-") && !keep.has(key)) await caches.delete(key);
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

const isStaticAsset = (url) =>
  url.pathname.startsWith("/_next/static/") ||
  url.pathname.startsWith("/pwa/") ||
  url.pathname.startsWith("/icons/") ||
  url.pathname.startsWith("/avatars/") ||
  url.pathname === "/favicon.ico";

async function trim(cache) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - MAX_STATIC_ENTRIES; i++) await cache.delete(keys[i]);
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok && response.type === "basic") {
    await cache.put(request, response.clone());
    trim(cache);
  }
  return response;
}

async function networkFirstPage(event) {
  try {
    const preloaded = await event.preloadResponse;
    return preloaded || (await fetch(event.request));
  } catch {
    const offline = await caches.match(OFFLINE_URL);
    return offline || new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // RSC payloads and prefetches follow Next's own caching rules.
  if (request.headers.get("RSC") || url.searchParams.has("_rsc")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(event));
    return;
  }
  if (isStaticAsset(url)) event.respondWith(cacheFirst(request));
});
