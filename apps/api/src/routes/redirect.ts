import { type Database, qrCodes, scanEvents } from "@qdot/database";
import { eq } from "drizzle-orm";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Env } from "../env";
import type { GeoResolver } from "../services/geoip";
import { CODE_PATTERN } from "../services/qr-codes";
import { parseUserAgent } from "../services/user-agent";
import { visitorHash } from "../services/visitor-hash";

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Minimal branded page for unknown or inactive codes (the scanner sees this on their phone). */
function messagePage(reply: FastifyReply, status: number, title: string, text: string) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(title)} · Qdot</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#18181b;color:#f5f0eb;font:16px/1.5 system-ui,-apple-system,sans-serif;text-align:center;padding:24px}h1{font-size:24px;margin:0 0 8px}p{color:#a39eac;margin:0}.logo{width:32px;height:32px;border-radius:8px;background:#fff;display:inline-grid;place-items:center;margin-bottom:24px}.logo i{width:16px;height:16px;border-radius:4px;background:#18181b;display:grid;place-items:center}.logo b{width:6px;height:6px;background:#f5f0eb;border-radius:1px}</style></head>
<body><main><span class="logo"><i><b></b></i></span><h1>${escapeHtml(title)}</h1><p>${escapeHtml(text)}</p></main></body></html>`;
  return reply.status(status).header("Cache-Control", "no-store").type("text/html; charset=utf-8").send(html);
}

function referrerHost(request: FastifyRequest): string | null {
  const ref = request.headers.referer;
  if (!ref) return null;
  try {
    return new URL(ref).hostname || null;
  } catch {
    return null;
  }
}

export async function redirectRoutes(app: FastifyInstance, { db, geo }: { db: Database; env: Env; geo: GeoResolver }) {
  app.route<{ Params: { code: string } }>({
    method: ["GET", "HEAD"],
    url: "/r/:code",
    handler: async (request, reply) => {
      const code = request.params.code.toLowerCase();
      if (!CODE_PATTERN.test(code)) return messagePage(reply, 404, "QR code not found", "This link doesn't match any Qdot code.");

      const [qr] = await db
        .select({ id: qrCodes.id, destinationUrl: qrCodes.destinationUrl, status: qrCodes.status })
        .from(qrCodes)
        .where(eq(qrCodes.code, code))
        .limit(1);
      if (!qr) return messagePage(reply, 404, "QR code not found", "This link doesn't match any Qdot code.");
      if (qr.status !== "active") return messagePage(reply, 410, "This QR code is paused", "Its owner has temporarily disabled it. Please try again later.");

      // Defense in depth: only ever redirect to http(s), even if bad data slipped in.
      let destination: URL;
      try {
        destination = new URL(qr.destinationUrl);
        if (destination.protocol !== "http:" && destination.protocol !== "https:") throw new Error("bad protocol");
      } catch {
        request.log.error({ qrId: qr.id }, "Stored destination is not a valid http(s) URL");
        return messagePage(reply, 410, "This QR code is unavailable", "Its destination is not valid.");
      }

      const ua = request.headers["user-agent"];
      const agent = parseUserAgent(ua);
      if (request.method === "GET" && !agent.isBot) {
        try {
          // The IP is used here, in memory, for GeoIP + the daily visitor hash, then discarded.
          const location = geo.lookup(request.ip);
          await db.insert(scanEvents).values({
            qrCodeId: qr.id,
            country: location?.country ?? null,
            countryCode: location?.countryCode ?? null,
            region: location?.region ?? null,
            city: location?.city ?? null,
            deviceType: agent.deviceType,
            os: agent.os,
            browser: agent.browser,
            referrer: referrerHost(request),
            visitorHash: visitorHash(request.ip, ua ?? ""),
          });
        } catch (err) {
          // Never block the scanner's redirect on analytics.
          request.log.error({ err, qrId: qr.id }, "Failed to record scan");
        }
      }

      // 302 + no-store: a cached 301 would bypass tracking and destination updates.
      return reply.status(302).header("Location", destination.toString()).header("Cache-Control", "no-store").send();
    },
  });
}
