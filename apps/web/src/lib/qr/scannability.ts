import { RECOMMENDED_MARGIN, type ErrorCorrectionLevel, type QRDesign } from "@/types";
import { isReliableEyeCombo } from "./render/eyes";

function luminance(hex: string): number | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

export function contrastRatio(a: string, b: string): number | null {
  const la = luminance(a);
  const lb = luminance(b);
  if (la === null || lb === null) return null;
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export function isHexColor(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value.trim());
}

function mixHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.replace("#", ""), 16);
  const pb = parseInt(b.replace("#", ""), 16);
  const ch = (p: number, s: number) => (p >> s) & 255;
  const mix = (s: number) => Math.round(ch(pa, s) + (ch(pb, s) - ch(pa, s)) * t);
  return `#${((mix(16) << 16) | (mix(8) << 8) | mix(0)).toString(16).padStart(6, "0").toUpperCase()}`;
}

/** Minimum eye/background contrast; below ~4.75 finder centers stop decoding reliably at small sizes. */
const MIN_EYE_CONTRAST = 5.2;

/**
 * Eye center color actually rendered: the chosen color, nudged toward the frame
 * color just enough to keep finder patterns decodable. On the default dark style
 * this turns #E8503A into a barely lighter coral.
 */
export function readableEyeColor(eyeColor: string, background: string, foreground: string): string {
  if (!isHexColor(eyeColor) || !isHexColor(background) || !isHexColor(foreground)) return foreground;
  for (let t = 0; t <= 1; t += 0.05) {
    const candidate = t === 0 ? eyeColor : mixHex(eyeColor, foreground, t);
    if ((contrastRatio(candidate, background) ?? 0) >= MIN_EYE_CONTRAST) return candidate;
  }
  return foreground;
}

/* ------------------------------------------------------------------ */
/* Design analysis                                                     */
/* ------------------------------------------------------------------ */

export type CheckLevel = "info" | "warning" | "error";
export type ScanCheckId =
  | "invalid-color"
  | "low-contrast"
  | "eye-shapes"
  | "eye-contrast"
  | "transparent"
  | "logo-too-large"
  | "logo-large"
  | "low-error-correction"
  | "quiet-zone"
  | "background-image"
  | "dense"
  | "sparse-logo";

export interface ScanCheck {
  id: ScanCheckId;
  level: CheckLevel;
}

export interface ScanReport {
  /** "ok" = easy to scan; otherwise the worst check level. */
  status: "ok" | "warning" | "error";
  checks: ScanCheck[];
}

/** Share of codewords each level can restore (ISO/IEC 18004). */
export const RECOVERY: Record<ErrorCorrectionLevel, number> = { L: 0.07, M: 0.15, Q: 0.25, H: 0.3 };

const moduleColors = (design: QRDesign) =>
  design.modules.fill.type === "solid" ? [design.modules.fill.color] : design.modules.fill.stops.map((s) => s.color);

/**
 * Heuristics calibrated against real decoding (see src/lib/qr/__tests__/decode.test.ts).
 * Never blocks saving: it informs.
 */
export function analyzeDesign(design: QRDesign, symbol: { size: number; version: number; errorCorrection: ErrorCorrectionLevel }): ScanReport {
  const checks: ScanCheck[] = [];
  const bg = design.background.color;
  const colors = [...moduleColors(design), design.eyes.frameColor, design.eyes.centerColor];

  if (![bg, ...colors].every(isHexColor)) {
    checks.push({ id: "invalid-color", level: "error" });
  } else {
    const worst = Math.min(...moduleColors(design).map((c) => contrastRatio(c, bg) ?? 0), contrastRatio(design.eyes.frameColor, bg) ?? 0);
    const needed = design.modules.textured && !design.logo ? 4 : 3;
    if (worst < 2) checks.push({ id: "low-contrast", level: "error" });
    else if (worst < needed) checks.push({ id: "low-contrast", level: "warning" });
    if ((contrastRatio(readableEyeColor(design.eyes.centerColor, bg, design.eyes.frameColor), bg) ?? 0) < 3) checks.push({ id: "eye-contrast", level: "warning" });
  }

  if (!isReliableEyeCombo(design.eyes)) checks.push({ id: "eye-shapes", level: "error" });
  if (design.background.transparent) checks.push({ id: "transparent", level: "info" });
  if (design.background.image) checks.push({ id: "background-image", level: "warning" });

  if (design.logo) {
    const plate = Math.max(3, Math.round(symbol.size * design.logo.size) | 1);
    const area = design.logo.shape === "circle" ? (Math.PI / 4) * plate * plate : plate * plate;
    const coverage = area / (symbol.size * symbol.size);
    const capacity = RECOVERY[symbol.errorCorrection];
    // A cleared area ruins whole codewords, so the usable budget is well below the nominal
    // recovery rate: calibrated on decodes (fails from ~60 %, fine below ~40 %).
    if (coverage > capacity * 0.6) checks.push({ id: "logo-too-large", level: "error" });
    else if (coverage > capacity * 0.4) checks.push({ id: "logo-large", level: "warning" });
    if (MODULE_SPARSE.has(design.modules.shape)) checks.push({ id: "sparse-logo", level: "warning" });
  }
  if ((design.logo || design.background.image) && (symbol.errorCorrection === "L" || symbol.errorCorrection === "M"))
    checks.push({ id: "low-error-correction", level: "warning" });

  if (design.margin < RECOMMENDED_MARGIN) checks.push({ id: "quiet-zone", level: "warning" });
  if (symbol.version >= 15) checks.push({ id: "dense", level: "warning" });

  const status = checks.some((c) => c.level === "error") ? "error" : checks.some((c) => c.level === "warning") ? "warning" : "ok";
  return { status, checks };
}

const MODULE_SPARSE = new Set<QRDesign["modules"]["shape"]>(["dots", "circle", "diamond"]);
