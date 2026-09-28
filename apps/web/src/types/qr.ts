export type QRStatus = "active" | "paused" | "archived" | "draft";

/** What the QR resolves to. Only `url` is dynamic (resolved by the redirect backend). */
export type QRContentType = "url" | "vcard" | "wifi" | "email" | "sms" | "phone";

export type QRPattern = "squares" | "dots" | "rounded" | "diamond";

export type QREyeShape = "classic" | "rounded" | "leaf" | "innerDot";

/** Use-case chosen during onboarding; drives defaults, not rendering. */
export type QRCategory = "website" | "menu" | "event" | "social" | "app" | "custom";

export interface QRStyle {
  pattern: QRPattern;
  eyeShape: QREyeShape;
  /** Module color. */
  foreground: string;
  /** Canvas color. */
  background: string;
  /** Color of the eye centers (the coral signature in the design). */
  eyeColor: string;
  /** Subtle per-module opacity variation seen across the Qdot v2 visuals. */
  textured: boolean;
  /** Data URL or remote URL of an embedded logo. */
  logo: string | null;
}

export interface QRCode {
  id: string;
  /** Short code resolved by the redirect service: `${REDIRECT_BASE_URL}/${slug}`. */
  slug: string;
  name: string;
  type: QRContentType;
  category: QRCategory;
  destinationUrl: string;
  status: QRStatus;
  style: QRStyle;
  campaignId: string | null;
  totalScans: number;
  uniqueScans: number;
  lastScanAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQRCodeInput {
  name: string;
  type: QRContentType;
  category: QRCategory;
  destinationUrl: string;
  style: QRStyle;
  campaignId?: string | null;
  /** Short code reserved client-side so the previewed QR matches the printed one. */
  slug?: string;
  status?: Extract<QRStatus, "active" | "draft">;
}

export type UpdateQRCodeInput = Partial<
  Pick<QRCode, "name" | "type" | "category" | "destinationUrl" | "status" | "style" | "campaignId">
>;
