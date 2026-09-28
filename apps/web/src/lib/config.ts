/**
 * Runtime configuration. Everything here is public (NEXT_PUBLIC_*) because the
 * frontend talks to an API hosted separately.
 */

/** Base URL of the Qdot API (e.g. http://localhost:4000). When unset, the API layer serves mock data. */
export const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || null;

export const USE_MOCK_API = API_URL === null;

/**
 * Only used to draw the editor's live preview before a code exists. Saved codes
 * always use the `shortUrl` returned by the API (built from its QR_REDIRECT_BASE_URL).
 */
const PREVIEW_REDIRECT_BASE_URL = (process.env.NEXT_PUBLIC_REDIRECT_BASE_URL || API_URL || "https://qr.qdot.com").replace(/\/$/, "");

export function previewShortUrl(code: string): string {
  return `${PREVIEW_REDIRECT_BASE_URL}/r/${code}`;
}
