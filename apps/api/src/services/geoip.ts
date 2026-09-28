import { existsSync } from "node:fs";
import { isIP } from "node:net";
import maxmind, { type CityResponse, type Reader } from "maxmind";

export interface GeoLocation {
  country: string | null;
  countryCode: string | null;
  region: string | null;
  city: string | null;
}

/** Swap this interface's implementation to change GeoIP provider. */
export interface GeoResolver {
  readonly provider: string;
  lookup(ip: string): GeoLocation | null;
}

export const nullGeoResolver: GeoResolver = { provider: "none", lookup: () => null };

/** Loopback, private (RFC1918), link-local and ULA ranges have no geography. */
export function isPrivateIp(ip: string): boolean {
  const v = ip.replace(/^::ffff:/, "");
  return (
    /^(10\.|127\.|169\.254\.|192\.168\.|0\.)/.test(v) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(v) ||
    v === "::1" ||
    /^f[cd][0-9a-f]{2}:/i.test(v) ||
    /^fe80:/i.test(v)
  );
}

/**
 * Reads a local MaxMind-format City database (MaxMind GeoLite2-City or the
 * free DB-IP City Lite). Lookups are in-process: no network call per scan.
 */
export async function createGeoResolver(dbPath: string, log: (msg: string) => void): Promise<GeoResolver> {
  if (!existsSync(dbPath)) {
    log(`GeoIP database not found at ${dbPath}; scans will be recorded without location. Run \`pnpm --filter @qdot/api geoip:download\`.`);
    return nullGeoResolver;
  }
  const reader: Reader<CityResponse> = await maxmind.open<CityResponse>(dbPath);
  log(`GeoIP database loaded from ${dbPath}`);
  return {
    provider: "mmdb",
    lookup(ip) {
      const addr = ip.replace(/^::ffff:/, "");
      if (!isIP(addr) || isPrivateIp(addr)) return null;
      const r = reader.get(addr);
      if (!r) return null;
      return {
        country: r.country?.names?.en ?? null,
        countryCode: r.country?.iso_code ?? null,
        region: r.subdivisions?.[0]?.names?.en ?? null,
        city: r.city?.names?.en ?? null,
      };
    },
  };
}
