/**
 * Optional zero-install development database: real Postgres (PGlite) served on
 * localhost:5432 over the Postgres wire protocol, persisted to data/pglite.
 * Use it when PostgreSQL isn't installed yet; production uses a real server.
 *
 *   DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres
 *   DATABASE_POOL_MAX=1   (required: PGlite serves one connection at a time;
 *                          concurrent connections get their messages interleaved)
 */
import { mkdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const dir = "data/pglite";
const port = Number(process.env.EMBEDDED_DB_PORT ?? 5432);
mkdirSync(dir, { recursive: true });

const db = await PGlite.create(dir);
// PGlite multiplexes clients over one engine; the API pool needs several connections.
const server = new PGLiteSocketServer({ db, port, host: "127.0.0.1", maxConnections: 20 });
await server.start();
console.log(`Embedded Postgres (PGlite) listening on 127.0.0.1:${port}, data in ${dir}`);
console.log(`DATABASE_URL=postgres://postgres:postgres@localhost:${port}/postgres  (and DATABASE_POOL_MAX=1)`);

const stop = async () => {
  await server.stop();
  await db.close();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
