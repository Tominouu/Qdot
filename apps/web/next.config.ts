import type { NextConfig } from "next";

/**
 * Identifies a deploy. The service worker is registered as /sw.js?v=<id>, so a new
 * deploy installs a new worker (and drops the previous build's caches).
 */
const APP_VERSION = process.env.APP_VERSION ?? process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.COMMIT_REF ?? String(Date.now());

const nextConfig: NextConfig = {
  // Shared API contract (TypeScript sources) from the monorepo.
  transpilePackages: ["@qdot/types"],
  env: { NEXT_PUBLIC_APP_VERSION: APP_VERSION },
  async headers() {
    return [
      {
        // Browsers must always revalidate the worker script itself, or updates get stuck.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
      {
        source: "/offline.html",
        headers: [{ key: "Cache-Control", value: "no-cache" }],
      },
    ];
  },
};

export default nextConfig;
