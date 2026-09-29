import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { createDatabase, type Database } from "@qdot/database";
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
const MIGRATIONS = fileURLToPath(new URL("../../../packages/database/migrations", import.meta.url));

/** A copy of the migrations folder that stops after `lastTag` (to seed data in an older schema). */
function migrationsUpTo(lastTag: string): string {
  const dir = mkdtempSync(join(tmpdir(), "qdot-migrations-"));
  cpSync(MIGRATIONS, dir, { recursive: true });
  const journalPath = join(dir, "meta/_journal.json");
  const journal = JSON.parse(readFileSync(journalPath, "utf8")) as { entries: { tag: string }[] };
  const last = journal.entries.findIndex((e) => e.tag === lastTag);
  if (last === -1) throw new Error(`Unknown migration ${lastTag}`);
  journal.entries = journal.entries.slice(0, last + 1);
  writeFileSync(journalPath, JSON.stringify(journal));
  return dir;
}

/**
 * `logs`: collect every log line (info and above) to assert nothing sensitive is logged.
 * `seedBefore`: migrate only up to `upTo`, run `seed` against that older schema, then
 * apply the remaining migrations, exactly like a production database being upgraded.
 */
export async function startTestApi(opts: { logs?: string[]; seedBefore?: { upTo: string; seed: (db: Database) => Promise<void> } } = {}) {
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
  if (opts.seedBefore) {
    await migrate(db, { migrationsFolder: migrationsUpTo(opts.seedBefore.upTo) });
    await opts.seedBefore.seed(db);
  }
  await migrate(db, { migrationsFolder: MIGRATIONS });
  const logger = opts.logs
    ? { level: "info", stream: { write: (line: string) => void opts.logs!.push(line) } }
    : process.env.TEST_LOG
      ? { level: "error" }
      : false;
  const app = await buildApp({ env, db, geo: testGeo, logger });

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

let clientCount = 0;

/** Small cookie-jar client around app.inject, like a browser session. Each client has its own IP, like a real visitor. */
export function client(app: App) {
  const n = ++clientCount;
  const remoteAddress = `10.${(n >> 16) & 255}.${(n >> 8) & 255}.${n & 255}`;
  let cookie: string | undefined;
  /** Selected workspace, sent like the web app does (X-Qdot-Workspace). */
  let workspace: string | undefined;
  const call = async (opts: InjectOptions) => {
    const res = await app.inject({
      remoteAddress,
      ...opts,
      headers: { ...(cookie ? { cookie } : {}), ...(workspace ? { "x-qdot-workspace": workspace } : {}), ...(opts.headers ?? {}) },
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
    del: (url: string, payload?: unknown) => call({ method: "DELETE", url, payload: payload as object }),
    get cookie() {
      return cookie;
    },
    use(workspaceId: string | undefined) {
      workspace = workspaceId;
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
