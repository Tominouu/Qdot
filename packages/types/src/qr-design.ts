import { z } from "zod";

/**
 * Visual design of a QR code (version 2). Stored as JSON in
 * `qr_codes.configuration`; codes saved before v2 hold the legacy `QRStyle`
 * shape and are upgraded on read by `normalizeDesign`.
 *
 * Shapes are string ids so the renderer (apps/web/src/lib/qr/render) can grow
 * new ones without schema churn beyond adding the id here.
 */

export const MODULE_SHAPES = ["square", "rounded", "dots", "circle", "diamond", "classy", "classy-rounded", "extra-rounded"] as const;
/** Outer contour and inner (hole) contour of the three finder patterns. */
export const EYE_FRAME_SHAPES = ["square", "rounded", "circle", "leaf"] as const;
export const EYE_CENTER_SHAPES = ["square", "rounded", "dot", "circle", "leaf"] as const;
export const LOGO_SHAPES = ["square", "rounded", "circle"] as const;
export const GRADIENT_TYPES = ["linear", "radial"] as const;
export const ERROR_CORRECTION_LEVELS = ["L", "M", "Q", "H"] as const;

export type ModuleShape = (typeof MODULE_SHAPES)[number];
export type EyeFrameShape = (typeof EYE_FRAME_SHAPES)[number];
export type EyeCenterShape = (typeof EYE_CENTER_SHAPES)[number];
export type LogoShape = (typeof LOGO_SHAPES)[number];
export type ErrorCorrectionLevel = (typeof ERROR_CORRECTION_LEVELS)[number];
export type ErrorCorrectionSetting = ErrorCorrectionLevel | "auto";

/** Quiet zone, in modules. Below 2 many scanners fail; the spec recommends 4. */
export const MIN_MARGIN = 2;
export const MAX_MARGIN = 10;
export const RECOMMENDED_MARGIN = 4;
export const LOGO_SIZE_RANGE = { min: 0.1, max: 0.3 } as const;

/** ~1 MB image once base64-encoded. */
export const MAX_LOGO_DATA_URL_LENGTH = 1_400_000;

export const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Expected a #RRGGBB color");

export const imageDataUrl = z
  .string()
  .max(MAX_LOGO_DATA_URL_LENGTH, "Image is too large (max 1 MB)")
  .regex(/^data:image\/(png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/, "Image must be a PNG, JPG, WebP or SVG data URL");

const GradientStopSchema = z.object({ offset: z.number().min(0).max(1), color: hexColor });

export const FillSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("solid"), color: hexColor }),
  z.object({
    type: z.enum(GRADIENT_TYPES),
    /** Degrees, 0 = left → right. Ignored for radial gradients. */
    rotation: z.number().min(0).max(360).default(0),
    stops: z.array(GradientStopSchema).min(2).max(4),
  }),
]);
export type QRFill = z.infer<typeof FillSchema>;

export const QRDesignSchema = z.object({
  version: z.literal(2),
  modules: z.object({
    shape: z.enum(MODULE_SHAPES),
    /** Subtle per-module opacity variation (Qdot's signature look). */
    textured: z.boolean().default(false),
    fill: FillSchema,
  }),
  eyes: z.object({
    outer: z.enum(EYE_FRAME_SHAPES),
    inner: z.enum(EYE_FRAME_SHAPES),
    center: z.enum(EYE_CENTER_SHAPES),
    frameColor: hexColor,
    centerColor: hexColor,
  }),
  background: z.object({
    color: hexColor,
    transparent: z.boolean().default(false),
    image: z.object({ src: imageDataUrl, opacity: z.number().min(0.05).max(1) }).nullable().default(null),
  }),
  logo: z
    .object({
      src: imageDataUrl,
      /** Fraction of the symbol width. */
      size: z.number().min(LOGO_SIZE_RANGE.min).max(LOGO_SIZE_RANGE.max),
      /** Clear space around the image inside its plate, in modules. */
      margin: z.number().min(0).max(2),
      /** Plate behind the logo; null = no plate (modules are still cleared). */
      background: hexColor.nullable(),
      shape: z.enum(LOGO_SHAPES),
    })
    .nullable(),
  margin: z.number().int().min(MIN_MARGIN).max(MAX_MARGIN),
  errorCorrection: z.enum([...ERROR_CORRECTION_LEVELS, "auto"]),
});
export type QRDesign = z.output<typeof QRDesignSchema>;

/* ------------------------------------------------------------------ */
/* Legacy v1 style (codes saved before the designer)                   */
/* ------------------------------------------------------------------ */

export const QR_PATTERNS = ["squares", "dots", "rounded", "diamond"] as const;
export const QR_EYE_SHAPES = ["classic", "rounded", "leaf", "innerDot"] as const;
export type QRPattern = (typeof QR_PATTERNS)[number];
export type QREyeShape = (typeof QR_EYE_SHAPES)[number];

export const QRStyleSchema = z.object({
  pattern: z.enum(QR_PATTERNS),
  eyeShape: z.enum(QR_EYE_SHAPES),
  foreground: hexColor,
  background: hexColor,
  eyeColor: hexColor,
  textured: z.boolean(),
  logo: imageDataUrl.nullable(),
});
/** @deprecated v1 design, still accepted by the API and upgraded with `legacyStyleToDesign`. */
export type QRStyle = z.infer<typeof QRStyleSchema>;

const LEGACY_SHAPE: Record<QRPattern, ModuleShape> = { squares: "square", dots: "circle", rounded: "rounded", diamond: "diamond" };
const LEGACY_EYES: Record<QREyeShape, Pick<QRDesign["eyes"], "outer" | "inner" | "center">> = {
  classic: { outer: "square", inner: "square", center: "square" },
  rounded: { outer: "rounded", inner: "rounded", center: "rounded" },
  leaf: { outer: "leaf", inner: "leaf", center: "leaf" },
  innerDot: { outer: "rounded", inner: "rounded", center: "circle" },
};

/** v1 → v2. Margin 3 and "auto" error correction reproduce what v1 exported. */
export function legacyStyleToDesign(style: QRStyle): QRDesign {
  return {
    version: 2,
    modules: { shape: LEGACY_SHAPE[style.pattern], textured: style.textured, fill: { type: "solid", color: style.foreground } },
    eyes: { ...LEGACY_EYES[style.eyeShape], frameColor: style.foreground, centerColor: style.eyeColor },
    background: { color: style.background, transparent: false, image: null },
    logo: style.logo ? { src: style.logo, size: 0.2, margin: 0.5, background: style.background, shape: "rounded" } : null,
    margin: 3,
    errorCorrection: "auto",
  };
}

/** The Qdot signature style: light tiles on zinc with coral eye centers. */
export const DEFAULT_QR_DESIGN: QRDesign = {
  version: 2,
  modules: { shape: "rounded", textured: true, fill: { type: "solid", color: "#FAFAFA" } },
  eyes: { outer: "rounded", inner: "rounded", center: "rounded", frameColor: "#FAFAFA", centerColor: "#E8503A" },
  background: { color: "#27272A", transparent: false, image: null },
  logo: null,
  margin: RECOMMENDED_MARGIN,
  errorCorrection: "auto",
};

/**
 * Any stored configuration → a valid v2 design. Never throws: unreadable data
 * falls back to the default design so a code always renders.
 */
export function normalizeDesign(raw: unknown): QRDesign {
  if (raw && typeof raw === "object" && (raw as { version?: unknown }).version === 2) {
    const parsed = QRDesignSchema.safeParse(raw);
    if (parsed.success) return parsed.data;
  }
  const legacy = QRStyleSchema.safeParse(raw);
  if (legacy.success) return legacyStyleToDesign(legacy.data);
  return structuredClone(DEFAULT_QR_DESIGN);
}

/** Level actually used to encode: "auto" picks H when something covers modules. */
export function resolveErrorCorrection(design: Pick<QRDesign, "errorCorrection" | "logo" | "background">): ErrorCorrectionLevel {
  if (design.errorCorrection !== "auto") return design.errorCorrection;
  return design.logo || design.background.image ? "H" : "M";
}
