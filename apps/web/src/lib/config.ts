/**
 * Runtime configuration. Everything here is public (NEXT_PUBLIC_*) because the
 * frontend talks to an API hosted separately.
 */

/** Base URL of the Qdot API. When unset, the API layer serves mock data. */
export const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || null;

/**
 * Base URL of the redirect service that QR codes point to. The redirect backend
 * records the scan and responds with an HTTP redirect to the destination — the
 * frontend never handles scans itself.
 */
export const REDIRECT_BASE_URL = (
  process.env.NEXT_PUBLIC_REDIRECT_BASE_URL || "https://qr.example.com"
).replace(/\/$/, "");

export const USE_MOCK_API = API_URL === null;

export function shortUrlFor(slug: string): string {
  return `${REDIRECT_BASE_URL}/${slug}`;
}
