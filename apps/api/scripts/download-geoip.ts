/**
 * Downloads the free DB-IP "IP to City Lite" database (MaxMind .mmdb format,
 * CC BY 4.0 — https://db-ip.com) to data/geoip/dbip-city-lite.mmdb.
 * Re-run monthly (e.g. from cron) to keep locations current.
 */
import { createWriteStream, mkdirSync, renameSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";

const target = resolve(process.env.GEOIP_DB_PATH ?? "data/geoip/dbip-city-lite.mmdb");

function monthsBack(n: number): string {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - n);
  return d.toISOString().slice(0, 7);
}

mkdirSync(dirname(target), { recursive: true });

for (const month of [monthsBack(0), monthsBack(1)]) {
  const url = `https://download.db-ip.com/free/dbip-city-lite-${month}.mmdb.gz`;
  const res = await fetch(url);
  if (!res.ok || !res.body) {
    console.log(`${month}: not available (${res.status}), trying previous month…`);
    continue;
  }
  const tmp = `${target}.download`;
  await pipeline(Readable.fromWeb(res.body as import("node:stream/web").ReadableStream), createGunzip(), createWriteStream(tmp));
  renameSync(tmp, target);
  console.log(`✓ GeoIP database (${month}) saved to ${target}`);
  console.log("  IP geolocation by DB-IP (https://db-ip.com), CC BY 4.0.");
  process.exit(0);
}

console.error("Could not download the DB-IP database. Scans will be recorded without location.");
process.exit(1);
