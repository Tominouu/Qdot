import { DEFAULT_QR_DESIGN, normalizeDesign, type QRCode, type QRStyle } from "@/types";

/** The original Qdot style in the legacy (v1) format these fixtures were written in. */
const DEFAULT_QR_STYLE: QRStyle = {
  pattern: "rounded",
  eyeShape: "rounded",
  foreground: "#FAFAFA",
  background: "#27272A",
  eyeColor: "#E8503A",
  textured: true,
  logo: null,
};

/** A code as stored before the designer: v1 `style`, no content/mode. */
type LegacyMockQR = Omit<QRCode, "design" | "mode" | "content" | "contentRedacted" | "destinationUrl" | "workspaceId"> & { destinationUrl: string; style: QRStyle };

/**
 * Brings any stored mock code (v1 fixtures, localStorage from older versions,
 * or current ones) to the current shape — same rules as the API.
 */
export function upgradeMockQR(stored: QRCode | LegacyMockQR): QRCode {
  const raw = stored as Partial<QRCode> & { style?: QRStyle; destinationUrl?: string | null };
  const { style, ...rest } = raw;
  const mode = raw.mode ?? "dynamic";
  const content = raw.content ?? { type: "url" as const, url: raw.destinationUrl ?? "" };
  return {
    ...(rest as QRCode),
    // Codes saved before workspaces belonged to the personal space.
    workspaceId: raw.workspaceId ?? "ws_personal",
    type: content.type,
    mode,
    content,
    contentRedacted: false,
    destinationUrl: mode === "dynamic" && content.type === "url" ? content.url : null,
    design: normalizeDesign(raw.design ?? style ?? DEFAULT_QR_DESIGN),
  };
}

/** Short URL for mock codes (the real API builds it from QR_REDIRECT_BASE_URL). */
export function mockShortUrl(code: string): string {
  return `https://qr.qdot.com/r/${code}`;
}

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

const LEGACY_FIXTURES: LegacyMockQR[] = [
  {
    id: "qr_summer_menu",
    code: "sm26x9",
    shortUrl: mockShortUrl("sm26x9"),
    name: "Summer Menu",
    type: "url",
    category: "menu",
    destinationUrl: "https://yourmenu.com/summer-list",
    status: "active",
    style: DEFAULT_QR_STYLE,
    campaignId: "summer-2026",
    totalScans: 12482,
    uniqueScans: 8934,
    lastScanAt: minutesAgo(2),
    createdAt: "2026-05-01T09:12:00.000Z",
    updatedAt: "2026-09-25T16:40:00.000Z",
  },
  {
    id: "qr_product_launch",
    code: "pl8k2m",
    shortUrl: mockShortUrl("pl8k2m"),
    name: "Product Launch",
    type: "url",
    category: "website",
    destinationUrl: "https://shop.com/new-drop",
    status: "active",
    style: { ...DEFAULT_QR_STYLE, pattern: "squares" },
    campaignId: null,
    totalScans: 8741,
    uniqueScans: 6120,
    lastScanAt: minutesAgo(5),
    createdAt: "2026-06-14T10:00:00.000Z",
    updatedAt: "2026-09-20T08:10:00.000Z",
  },
  {
    id: "qr_instagram",
    code: "ig4v7p",
    shortUrl: mockShortUrl("ig4v7p"),
    name: "Instagram Page",
    type: "url",
    category: "social",
    destinationUrl: "https://instagram.com/yourmenu",
    status: "active",
    style: { ...DEFAULT_QR_STYLE, pattern: "dots", eyeShape: "innerDot" },
    campaignId: "summer-2026",
    totalScans: 8156,
    uniqueScans: 5891,
    lastScanAt: minutesAgo(9),
    createdAt: "2026-05-02T11:30:00.000Z",
    updatedAt: "2026-09-18T12:00:00.000Z",
  },
  {
    id: "qr_restaurant_wifi",
    code: "wf3n1q",
    shortUrl: mockShortUrl("wf3n1q"),
    name: "Restaurant WiFi",
    type: "url",
    category: "menu",
    destinationUrl: "https://yourmenu.com/wifi",
    status: "active",
    style: DEFAULT_QR_STYLE,
    campaignId: "summer-2026",
    totalScans: 4820,
    uniqueScans: 3104,
    lastScanAt: minutesAgo(14),
    createdAt: "2026-05-01T09:40:00.000Z",
    updatedAt: "2026-08-30T19:22:00.000Z",
  },
  {
    id: "qr_feedback",
    code: "fb7r2d",
    shortUrl: mockShortUrl("fb7r2d"),
    name: "Feedback Form",
    type: "url",
    category: "custom",
    destinationUrl: "https://forms.yourmenu.com/feedback",
    status: "active",
    style: { ...DEFAULT_QR_STYLE, eyeShape: "classic" },
    campaignId: "summer-2026",
    totalScans: 3287,
    uniqueScans: 2452,
    lastScanAt: minutesAgo(26),
    createdAt: "2026-05-03T14:05:00.000Z",
    updatedAt: "2026-09-11T09:00:00.000Z",
  },
  {
    id: "qr_social_links",
    code: "sl2c8w",
    shortUrl: mockShortUrl("sl2c8w"),
    name: "Social Links",
    type: "url",
    category: "social",
    destinationUrl: "https://bio.link/mycompany",
    status: "active",
    style: { ...DEFAULT_QR_STYLE, pattern: "diamond" },
    campaignId: null,
    totalScans: 3156,
    uniqueScans: 2210,
    lastScanAt: minutesAgo(30),
    createdAt: "2026-07-08T16:20:00.000Z",
    updatedAt: "2026-09-02T10:45:00.000Z",
  },
  {
    id: "qr_promo_brochure",
    code: "pb5h6t",
    shortUrl: mockShortUrl("pb5h6t"),
    name: "Promo Brochure",
    type: "url",
    category: "event",
    destinationUrl: "https://example.com/brochure-discount",
    status: "paused",
    style: DEFAULT_QR_STYLE,
    campaignId: null,
    totalScans: 982,
    uniqueScans: 744,
    lastScanAt: minutesAgo(60 * 26),
    createdAt: "2026-04-12T08:00:00.000Z",
    updatedAt: "2026-09-01T13:00:00.000Z",
  },
  {
    id: "qr_newsletter",
    code: "nl9j4e",
    shortUrl: mockShortUrl("nl9j4e"),
    name: "Newsletter",
    type: "url",
    category: "website",
    destinationUrl: "https://newsletter.com/opt-in",
    status: "archived",
    style: { ...DEFAULT_QR_STYLE, pattern: "squares", eyeShape: "classic" },
    campaignId: null,
    totalScans: 567,
    uniqueScans: 431,
    lastScanAt: minutesAgo(60 * 24 * 40),
    createdAt: "2026-02-03T08:00:00.000Z",
    updatedAt: "2026-07-01T09:30:00.000Z",
  },
];

const STATIC_FIXTURES: QRCode[] = [
  {
    id: "qr_guest_wifi",
    workspaceId: "ws_personal",
    code: "gw7k3p",
    shortUrl: mockShortUrl("gw7k3p"),
    name: "Guest Wi-Fi",
    type: "wifi",
    mode: "static",
    category: "custom",
    content: { type: "wifi", ssid: "Bistro-Guests", security: "WPA", password: "welcome2026", hidden: false },
    contentRedacted: false,
    destinationUrl: null,
    status: "active",
    design: {
      ...DEFAULT_QR_DESIGN,
      modules: { shape: "extra-rounded", textured: false, fill: { type: "solid", color: "#FAFAFA" } },
      eyes: { ...DEFAULT_QR_DESIGN.eyes, outer: "circle", inner: "circle", center: "circle" },
    },
    campaignId: null,
    totalScans: 0,
    uniqueScans: 0,
    lastScanAt: null,
    createdAt: "2026-09-20T10:00:00.000Z",
    updatedAt: "2026-09-20T10:00:00.000Z",
  },
];

export const QR_CODES: QRCode[] = [...LEGACY_FIXTURES.map(upgradeMockQR), ...STATIC_FIXTURES];
