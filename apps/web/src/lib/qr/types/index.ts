import type { Dictionary } from "@/lib/i18n/dictionaries";
import { QR_CONTENT_TYPES, type QRCode, type QRContent, type QRContentOf, type QRContentType } from "@/types";
import type { FieldErrors, QRTypeDefinition } from "./define";
import { emailType } from "./email";
import { phoneType } from "./phone";
import { smsType } from "./sms";
import { urlType } from "./url";
import { vcardType } from "./vcard";
import { wifiType } from "./wifi";

export type { FieldErrors, QRTypeDefinition } from "./define";

/** Registry of content types. Order = order in the editor. */
export const QR_TYPES: { [T in QRContentType]: QRTypeDefinition<T> } = {
  url: urlType,
  wifi: wifiType,
  vcard: vcardType,
  email: emailType,
  sms: smsType,
  phone: phoneType,
};

export const QR_TYPE_LIST = QR_CONTENT_TYPES.map((t) => QR_TYPES[t]);

// Content and definition always share `type`; the casts bridge TypeScript's lack of correlated unions.
const def = (c: QRContent) => QR_TYPES[c.type] as unknown as QRTypeDefinition<QRContentType> & {
  payload: (c: QRContent) => string;
  validate: (c: QRContent, t: Dictionary) => FieldErrors;
  summary: (c: QRContent) => string;
};

export const contentPayload = (c: QRContent) => def(c).payload(c);
export const validateContent = (c: QRContent, t: Dictionary) => def(c).validate(c, t);
export const contentSummary = (c: QRContent) => def(c).summary(c);
export const defaultContent = <T extends QRContentType>(type: T) => QR_TYPES[type].defaults() as QRContentOf<T>;

/** The string drawn into the image: the short link for dynamic codes, the content itself for static ones. */
export function qrPayload(qr: Pick<QRCode, "mode" | "shortUrl" | "content">): string {
  return qr.mode === "dynamic" ? qr.shortUrl : contentPayload(qr.content);
}
