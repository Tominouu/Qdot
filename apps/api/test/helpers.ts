import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { createDatabase } from "@qdot/database";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import type { InjectOptions } from "fastify";
import { buildApp } from "../src/app";
import { loadEnv } from "../src/env";
import type { GeoResolver } from "../src/services/geoip";

/** Stub GeoIP: a few fixed public IPs map to known places. */
export const testGeo: GeoResolver = {
  provider: "test",
  lookup(ip) {
    const table: Record<string, { country: string; countryCode: string; region: string; city: string }> = {
      "81.2.69.160": { country: "France", countryCode: "FR", region: "Île-de-France", city: "Paris" },
      "81.2.69.161": { country: "Belgium", countryCode: "BE", region: "Brussels", city: "Brussels" },
    };
    return table[ip] ?? null;
  },
};

export const UA = {
  iphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  pixel:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36",
  mac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
  bot: "WhatsApp/2.24.1 A",
};

/**
 * Real Postgres (PGlite, in-memory) behind a Postgres wire-protocol socket, so
 * the API runs its normal postgres-js driver and migrations. No install needed.
 */
export async function startTestApi() {
  const pg = await PGlite.create();
  const port = 55000 + Math.floor(Math.random() * 5000);
  const server = new PGLiteSocketServer({ db: pg, port, host: "127.0.0.1", maxConnections: 10 });
  await server.start();
  const url = `postgres://postgres:postgres@127.0.0.1:${port}/postgres`;

  const env = loadEnv({
    NODE_ENV: "test",
    DATABASE_URL: url,
    SESSION_SECRET: "test-secret-test-secret-test-secret-123",
    CORS_ORIGIN: "http://localhost:3000",
    QR_REDIRECT_BASE_URL: "https://qr.qdot.test",
  });
  // PGlite is single-connection: its socket multiplexer interleaves concurrent
  // connections' protocol messages, so tests use one pooled connection.
  const { db, close } = createDatabase(url, { maxConnections: 1 });
  await migrate(db, { migrationsFolder: fileURLToPath(new URL("../../../packages/database/migrations", import.meta.url)) });
  const app = await buildApp({ env, db, geo: testGeo, logger: process.env.TEST_LOG ? { level: "error" } : false });

  return {
    app,
    db,
    async stop() {
      await app.close();
      await close();
      await server.stop();
      await pg.close();
    },
  };
}

type App = Awaited<ReturnType<typeof startTestApi>>["app"];

/** Small cookie-jar client around app.inject, like a browser session. */
export function client(app: App) {
  let cookie: string | undefined;
  const call = async (opts: InjectOptions) => {
    const res = await app.inject({
      ...opts,
      headers: { ...(cookie ? { cookie } : {}), ...(opts.headers ?? {}) },
    });
    const setCookie = res.headers["set-cookie"];
    const first = Array.isArray(setCookie) ? setCookie[0] : setCookie;
    if (first) cookie = first.split(";")[0];
    return res;
  };
  return {
    call,
    get: (url: string, headers?: Record<string, string>) => call({ method: "GET", url, headers }),
    post: (url: string, payload?: unknown, headers?: Record<string, string>) => call({ method: "POST", url, payload: payload as object, headers }),
    patch: (url: string, payload: unknown) => call({ method: "PATCH", url, payload: payload as object }),
    del: (url: string) => call({ method: "DELETE", url }),
    get cookie() {
      return cookie;
    },
  };
}

export const STYLE = {
  pattern: "rounded",
  eyeShape: "rounded",
  foreground: "#FAFAFA",
  background: "#27272A",
  eyeColor: "#E8503A",
  textured: true,
  logo: null,
} as const;
