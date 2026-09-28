import type { QRStyle } from "@/types";

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

export type Scannability = "scannable" | "low-contrast" | "invalid-color" | "sparse-logo";

/**
 * Client-side heuristic, calibrated against jsQR decoding of every style
 * combination: scanners need ~3:1 module/background contrast, and sparse
 * patterns (dots, diamond) combined with a logo decode unreliably.
 */
export function checkScannability(style: Pick<QRStyle, "foreground" | "background" | "textured" | "pattern" | "logo">): Scannability {
  const ratio = contrastRatio(style.foreground, style.background);
  if (ratio === null) return "invalid-color";
  if (ratio < (style.textured ? 4 : 3)) return "low-contrast";
  if (style.logo && (style.pattern === "dots" || style.pattern === "diamond")) return "sparse-logo";
  return "scannable";
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

/** Minimum eye/background contrast; below ~4.75 finder centers stop decoding reliably (jsQR, small sizes). */
const MIN_EYE_CONTRAST = 5.2;

/**
 * Returns the eye color actually rendered: the chosen color, nudged toward the
 * foreground just enough to keep finder patterns decodable. On the default
 * dark style this turns #E8503A into a barely lighter coral.
 */
export function readableEyeColor(eyeColor: string, background: string, foreground: string): string {
  if (!isHexColor(eyeColor) || !isHexColor(background) || !isHexColor(foreground)) return foreground;
  for (let t = 0; t <= 1; t += 0.05) {
    const candidate = t === 0 ? eyeColor : mixHex(eyeColor, foreground, t);
    if ((contrastRatio(candidate, background) ?? 0) >= MIN_EYE_CONTRAST) return candidate;
  }
  return foreground;
}
