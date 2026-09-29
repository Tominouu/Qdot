import { z } from "zod";

/**
 * What a QR code encodes, per content type. Stored as JSON in `qr_codes.content`
 * and kept separate from the visual design (`qr-design.ts`).
 *
 * Adding a type: add its schema here, list it in QR_CONTENT_TYPES, then register
 * a payload generator + form on the web side (apps/web/src/lib/qr/types).
 */
export const QR_CONTENT_TYPES = ["url", "wifi", "vcard", "email", "sms", "phone"] as const;
export type QRContentType = (typeof QR_CONTENT_TYPES)[number];

export const QR_MODES = ["dynamic", "static"] as const;
export type QRMode = (typeof QR_MODES)[number];

/**
 * Content types the redirect service can serve dynamically (the image encodes
 * a Qdot short link). Everything else is encoded directly in the image (static).
 */
export const DYNAMIC_CONTENT_TYPES: readonly QRContentType[] = ["url"];
export const supportsDynamic = (type: QRContentType) => DYNAMIC_CONTENT_TYPES.includes(type);

/** Only http(s) destinations: never javascript:, data:, file:, … */
export const DestinationUrlSchema = z
  .string()
  .trim()
  .max(2048, "URL is too long")
  .refine((value) => {
    try {
      const url = new URL(value);
      return (url.protocol === "http:" || url.protocol === "https:") && Boolean(url.hostname);
    } catch {
      return false;
    }
  }, "Destination must be a valid http(s) URL");

const text = (max: number) => z.string().trim().max(max).default("");
const PHONE = /^\+?[\d\s().-]{3,32}$/;
const phone = z.string().trim().regex(PHONE, "Enter a valid phone number");
const email = z.string().trim().max(254).regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address");

export const WIFI_SECURITY = ["WPA", "WPA3", "WEP", "nopass"] as const;
export type WifiSecurity = (typeof WIFI_SECURITY)[number];

export const UrlContentSchema = z.object({ type: z.literal("url"), url: DestinationUrlSchema });

export const WifiContentSchema = z
  .object({
    type: z.literal("wifi"),
    ssid: z.string().min(1, "Network name is required").max(32, "Network name is 32 characters max"),
    security: z.enum(WIFI_SECURITY).default("WPA"),
    /** Plain text in requests/responses to the owner; encrypted at rest by the API. */
    password: z.string().max(63, "Password is 63 characters max").default(""),
    hidden: z.boolean().default(false),
  })
  .refine((c) => c.security === "nopass" || c.password.length > 0, { message: "Password is required", path: ["password"] });

export const VCardContentSchema = z
  .object({
    type: z.literal("vcard"),
    firstName: text(80),
    lastName: text(80),
    organization: text(120),
    jobTitle: text(120),
    phone: z.union([z.literal(""), phone]).default(""),
    email: z.union([z.literal(""), email]).default(""),
    website: z.union([z.literal(""), DestinationUrlSchema]).default(""),
    street: text(160),
    city: text(80),
    postalCode: text(20),
    country: text(80),
  })
  .refine((c) => Boolean(c.firstName || c.lastName || c.organization), {
    message: "Enter a name or an organization",
    path: ["firstName"],
  });

export const EmailContentSchema = z.object({
  type: z.literal("email"),
  to: email,
  subject: text(200),
  body: text(1500),
});

export const SmsContentSchema = z.object({ type: z.literal("sms"), phone, message: text(500) });
export const PhoneContentSchema = z.object({ type: z.literal("phone"), phone });

export const QRContentSchema = z.discriminatedUnion("type", [
  UrlContentSchema,
  WifiContentSchema,
  VCardContentSchema,
  EmailContentSchema,
  SmsContentSchema,
  PhoneContentSchema,
]);

export type QRContent = z.output<typeof QRContentSchema>;
export type QRContentInput = z.input<typeof QRContentSchema>;
export type QRContentOf<T extends QRContentType> = Extract<QRContent, { type: T }>;
export type UrlContent = QRContentOf<"url">;
export type WifiContent = QRContentOf<"wifi">;
export type VCardContent = QRContentOf<"vcard">;
export type EmailContent = QRContentOf<"email">;
export type SmsContent = QRContentOf<"sms">;
export type PhoneContent = QRContentOf<"phone">;
