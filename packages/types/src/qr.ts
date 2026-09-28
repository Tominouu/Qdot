import { z } from "zod";

export const QR_STATUSES = ["active", "paused", "archived", "draft"] as const;
export const QR_PATTERNS = ["squares", "dots", "rounded", "diamond"] as const;
export const QR_EYE_SHAPES = ["classic", "rounded", "leaf", "innerDot"] as const;
export const QR_CATEGORIES = ["website", "menu", "event", "social", "app", "custom"] as const;
/** Content types shown in the editor. Only `url` is dynamic (and accepted by the API) today. */
export const QR_CONTENT_TYPES = ["url", "vcard", "wifi", "email", "sms", "phone"] as const;

export type QRStatus = (typeof QR_STATUSES)[number];
export type QRPattern = (typeof QR_PATTERNS)[number];
export type QREyeShape = (typeof QR_EYE_SHAPES)[number];
export type QRCategory = (typeof QR_CATEGORIES)[number];
export type QRContentType = (typeof QR_CONTENT_TYPES)[number];

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Expected a #RRGGBB color");

/** ~1 MB image once base64-encoded. */
export const MAX_LOGO_DATA_URL_LENGTH = 1_400_000;

const logoDataUrl = z
  .string()
  .max(MAX_LOGO_DATA_URL_LENGTH, "Logo is too large (max 1 MB)")
  .regex(/^data:image\/(png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/, "Logo must be a PNG, JPG, WebP or SVG data URL");

/** Persisted as JSON in `qr_codes.configuration`. */
export const QRStyleSchema = z.object({
  pattern: z.enum(QR_PATTERNS),
  eyeShape: z.enum(QR_EYE_SHAPES),
  foreground: hexColor,
  background: hexColor,
  eyeColor: hexColor,
  textured: z.boolean(),
  logo: logoDataUrl.nullable(),
});
export type QRStyle = z.infer<typeof QRStyleSchema>;

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

const name = z.string().trim().max(80, "Name must be 80 characters or fewer");

export const CreateQRCodeSchema = z.object({
  name: name.default(""),
  type: z.literal("url").default("url"),
  category: z.enum(QR_CATEGORIES).default("website"),
  destinationUrl: DestinationUrlSchema,
  style: QRStyleSchema,
  campaignId: z.string().uuid().nullable().optional(),
  status: z.enum(["active", "draft"]).default("active"),
});
export type CreateQRCodeInput = z.input<typeof CreateQRCodeSchema>;

export const UpdateQRCodeSchema = z
  .object({
    name,
    category: z.enum(QR_CATEGORIES),
    destinationUrl: DestinationUrlSchema,
    style: QRStyleSchema,
    campaignId: z.string().uuid().nullable(),
    status: z.enum(QR_STATUSES),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Nothing to update");
export type UpdateQRCodeInput = z.input<typeof UpdateQRCodeSchema>;

export interface QRCode {
  id: string;
  /** Public, random identifier used in the redirect URL. Never the database id. */
  code: string;
  /** Full URL encoded in the QR image, e.g. https://qr.qdot.com/r/abc123xy */
  shortUrl: string;
  name: string;
  type: QRContentType;
  category: QRCategory;
  destinationUrl: string;
  status: QRStatus;
  style: QRStyle;
  campaignId: string | null;
  totalScans: number;
  /** Approximate unique daily visitors (privacy-preserving, see API docs). */
  uniqueScans: number;
  lastScanAt: string | null;
  createdAt: string;
  updatedAt: string;
}
