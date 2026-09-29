import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { QRContentOf, QRContentType } from "@/types";

/** Field → message (in the UI language). Empty = valid. */
export type FieldErrors = Partial<Record<string, string>>;

/**
 * Everything the app needs to know about one QR content type. Forms live in
 * components/qr/editor/content; everything here is pure (shared by editor,
 * exports, lists and tests).
 */
export interface QRTypeDefinition<T extends QRContentType> {
  type: T;
  /** Can the redirect service serve it (image encodes a Qdot short link)? */
  dynamic: boolean;
  defaults: () => QRContentOf<T>;
  /** The exact string encoded in a static QR code. */
  payload: (content: QRContentOf<T>) => string;
  validate: (content: QRContentOf<T>, t: Dictionary) => FieldErrors;
  /** One-line description for lists and cards. */
  summary: (content: QRContentOf<T>) => string;
}

export const defineQRType = <T extends QRContentType>(def: QRTypeDefinition<T>) => def;

export const PHONE_PATTERN = /^\+?[\d\s().-]{3,32}$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Keeps a leading + and digits only ("+33 6 12-34" → "+33612 34" → "+3361234"). */
export const normalizePhone = (raw: string) => raw.trim().replace(/(?!^\+)[^\d]/g, "");

export function isHttpUrl(raw: string): boolean {
  try {
    const u = new URL(raw.trim());
    return (u.protocol === "http:" || u.protocol === "https:") && Boolean(u.hostname);
  } catch {
    return false;
  }
}
