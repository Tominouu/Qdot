import { z } from "zod";
import {
  DestinationUrlSchema,
  QR_MODES,
  QRContentSchema,
  supportsDynamic,
  type QRContent,
  type QRContentType,
  type QRMode,
} from "./qr-content";
import { DEFAULT_QR_DESIGN, legacyStyleToDesign, QRDesignSchema, QRStyleSchema, type QRDesign } from "./qr-design";

export * from "./qr-content";
export * from "./qr-design";

export const QR_STATUSES = ["active", "paused", "archived", "draft"] as const;
export const QR_CATEGORIES = ["website", "menu", "event", "social", "app", "custom"] as const;

export type QRStatus = (typeof QR_STATUSES)[number];
export type QRCategory = (typeof QR_CATEGORIES)[number];

const name = z.string().trim().max(80, "Name must be 80 characters or fewer");

/**
 * Create input. The v2 shape is `{ mode, content, design }`; the v1 shape
 * `{ type: "url", destinationUrl, style }` is still accepted and upgraded.
 */
export const CreateQRCodeSchema = z
  .object({
    name: name.default(""),
    category: z.enum(QR_CATEGORIES).default("website"),
    campaignId: z.string().uuid().nullable().optional(),
    status: z.enum(["active", "draft"]).default("active"),
    mode: z.enum(QR_MODES).default("dynamic"),
    content: QRContentSchema.optional(),
    design: QRDesignSchema.optional(),
    /** @deprecated v1 */
    type: z.literal("url").optional(),
    /** @deprecated v1, use `content: { type: "url", url }` */
    destinationUrl: DestinationUrlSchema.optional(),
    /** @deprecated v1, use `design` */
    style: QRStyleSchema.optional(),
  })
  .transform(({ type: _type, destinationUrl, style, ...v }) => ({
    ...v,
    content: v.content ?? (destinationUrl !== undefined ? ({ type: "url", url: destinationUrl } as const) : undefined),
    design: v.design ?? (style ? legacyStyleToDesign(style) : structuredClone(DEFAULT_QR_DESIGN)),
  }))
  .superRefine((v, ctx) => {
    if (!v.content) ctx.addIssue({ code: "custom", path: ["content"], message: "Content is required" });
    else if (v.mode === "dynamic" && !supportsDynamic(v.content.type))
      ctx.addIssue({ code: "custom", path: ["mode"], message: `${v.content.type} QR codes can only be static` });
  })
  .transform((v) => ({ ...v, content: v.content as QRContent }));
export type CreateQRCodeInput = z.input<typeof CreateQRCodeSchema>;
export type CreateQRCodeData = z.output<typeof CreateQRCodeSchema>;

/** Mode is fixed at creation: switching would break codes that are already printed. */
export const UpdateQRCodeSchema = z
  .object({
    name,
    category: z.enum(QR_CATEGORIES),
    campaignId: z.string().uuid().nullable(),
    status: z.enum(QR_STATUSES),
    content: QRContentSchema,
    design: QRDesignSchema,
    /** @deprecated v1 */
    destinationUrl: DestinationUrlSchema,
    /** @deprecated v1 */
    style: QRStyleSchema,
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Nothing to update")
  .transform(({ destinationUrl, style, ...v }) => ({
    ...v,
    content: v.content ?? (destinationUrl !== undefined ? ({ type: "url", url: destinationUrl } as const) : undefined),
    design: v.design ?? (style ? legacyStyleToDesign(style) : undefined),
  }));
export type UpdateQRCodeInput = z.input<typeof UpdateQRCodeSchema>;
export type UpdateQRCodeData = z.output<typeof UpdateQRCodeSchema>;

export interface QRCode {
  id: string;
  workspaceId: string;
  /** Public, random identifier used in the redirect URL. Never the database id. */
  code: string;
  /** Redirect URL, e.g. https://qr.qdot.com/r/abc123xy. Encoded in the image only when `mode` is "dynamic". */
  shortUrl: string;
  name: string;
  type: QRContentType;
  /** "dynamic": the image encodes `shortUrl` (editable, tracked). "static": it encodes `content` directly. */
  mode: QRMode;
  category: QRCategory;
  content: QRContent;
  /** Redirect target of dynamic URL codes; null for static codes. */
  destinationUrl: string | null;
  /** True when secrets (Wi-Fi password) were stripped, as in list responses. */
  contentRedacted: boolean;
  status: QRStatus;
  design: QRDesign;
  campaignId: string | null;
  totalScans: number;
  /** Approximate unique daily visitors (privacy-preserving, see API docs). */
  uniqueScans: number;
  lastScanAt: string | null;
  createdAt: string;
  updatedAt: string;
}
