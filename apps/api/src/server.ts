import { createDatabase } from "@qdot/database";
import { buildApp } from "./app";
import { loadEnv } from "./env";
import { createGeoResolver } from "./services/geoip";
import { purgeExpiredSessions } from "./services/sessions";

const env = loadEnv();
const { db, close } = createDatabase(env.DATABASE_URL, { maxConnections: env.DATABASE_POOL_MAX });
const geo = await createGeoResolver(env.GEOIP_DB_PATH, (msg) => console.log(`[geoip] ${msg}`));

const app = await buildApp({
  env,
  db,
  geo,
  logger: { level: env.NODE_ENV === "test" ? "warn" : "info" },
});

// Housekeeping: drop expired sessions hourly.
const purge = setInterval(() => purgeExpiredSessions(db).catch((err) => app.log.error({ err }, "Session purge failed")), 60 * 60 * 1000);
purge.unref();

async function shutdown(signal: string) {
  app.log.info(`${signal} received, shutting down`);
  await app.close();
  await close();
  process.exit(0);
}
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

await app.listen({ host: env.HOST, port: env.PORT });
app.log.info(`QR redirects: ${env.QR_REDIRECT_BASE_URL}/r/:code · CORS: ${env.CORS_ORIGIN.join(", ")}`);
