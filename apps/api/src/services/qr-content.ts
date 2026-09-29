import type { QRCodeRow, StoredQRContent } from "@qdot/database";
import type { QRContent } from "@qdot/types";
import type { SecretBox } from "./secrets";

/**
 * Content as persisted in `qr_codes.content`. Secrets never reach the database
 * in clear: the Wi-Fi password becomes `passwordEnc` (see services/secrets.ts).
 */
export function sealContent(content: QRContent, box: SecretBox): StoredQRContent {
  if (content.type !== "wifi") return { ...content };
  const { password, ...rest } = content;
  return { ...rest, passwordEnc: password ? box.seal(password) : null };
}

/**
 * Stored row → API content.
 * - `box` given (owner viewing/editing one code): secrets are decrypted.
 * - `box` null (lists): secrets are stripped and `redacted` is true.
 * Codes created before content types only have `destination_url`.
 */
export function openContent(row: Pick<QRCodeRow, "content" | "mode" | "destinationUrl">, box: SecretBox | null): { content: QRContent; redacted: boolean } {
  const stored = row.content;
  // Dynamic URL codes: the redirect column is the source of truth.
  if (!stored || (stored.type === "url" && row.mode === "dynamic")) {
    return { content: { type: "url", url: row.destinationUrl ?? String(stored?.url ?? "") }, redacted: false };
  }
  if (stored.type !== "wifi") return { content: stored as unknown as QRContent, redacted: false };

  const { passwordEnc, ...rest } = stored as StoredQRContent & { passwordEnc?: string | null };
  const hasSecret = typeof passwordEnc === "string" && passwordEnc.length > 0;
  const password = hasSecret && box ? (box.open(passwordEnc) ?? "") : "";
  return { content: { ...(rest as Omit<Extract<QRContent, { type: "wifi" }>, "password">), password }, redacted: hasSecret && !box };
}
