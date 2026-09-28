import "dotenv/config";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createDatabase } from "@qdot/database";
import { migrate } from "drizzle-orm/postgres-js/migrator";

/** Applies pending migrations from packages/database/migrations. Works from src (tsx) and dist (node). */
const candidates = ["../../../packages/database/migrations", "../../packages/database/migrations"].map((p) =>
  fileURLToPath(new URL(p, import.meta.url)),
);
const migrationsFolder = candidates.find((p) => existsSync(p));

const url = process.env.DATABASE_URL;
if (!url || !migrationsFolder) {
  console.error(!url ? "DATABASE_URL is not set (see apps/api/.env.example)" : "Migrations folder not found");
  process.exit(1);
}

const { db, close } = createDatabase(url, { maxConnections: 1 });
try {
  await migrate(db, { migrationsFolder });
  console.log("✓ Database is up to date");
} finally {
  await close();
}
