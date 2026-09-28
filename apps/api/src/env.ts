import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url(),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
  /** Comma-separated list of allowed browser origins (the Qdot web app). */
  CORS_ORIGIN: z
    .string()
    .default("http://localhost:3000")
    .transform((v) =>
      v
        .split(",")
        .map((s) => s.trim().replace(/\/$/, ""))
        .filter(Boolean),
    ),
  /** Public base of redirect links encoded in QR codes, e.g. https://qr.qdot.com → https://qr.qdot.com/r/abc123xy */
  QR_REDIRECT_BASE_URL: z
    .string()
    .url()
    .transform((v) => v.replace(/\/$/, "")),
  /** Set when running behind Caddy/Nginx so request IPs come from X-Forwarded-For. */
  TRUST_PROXY: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  /** Secure cookies require HTTPS; defaults to true in production. */
  COOKIE_SECURE: z.enum(["true", "false"]).optional(),
  /** Optional: MaxMind/DB-IP City .mmdb file for GeoIP. */
  GEOIP_DB_PATH: z.string().default("data/geoip/dbip-city-lite.mmdb"),
  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),
});

export type Env = z.output<typeof EnvSchema> & { cookieSecure: boolean };

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment configuration (see apps/api/.env.example):\n${issues}`);
  }
  const env = parsed.data;
  return {
    ...env,
    cookieSecure: env.COOKIE_SECURE ? env.COOKIE_SECURE === "true" : env.NODE_ENV === "production",
  };
}
