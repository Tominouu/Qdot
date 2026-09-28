import QRCodeLib from "qrcode";
import { hashString, seededRandom } from "@/lib/utils/seeded-random";
import { readableEyeColor } from "./scannability";
import type { QREyeShape, QRPattern, QRStyle } from "@/types";

/**
 * Converts a payload + style into drawable geometry (SVG path data in module
 * units). Rendering (React or string/export) is a thin layer on top of this.
 */

export interface QRLayer {
  d: string;
  fill: string;
  opacity: number;
  fillRule?: "evenodd";
}

export interface QRGeometry {
  /** Number of modules per side (without margin). */
  size: number;
  /** viewBox edge including margin. */
  viewBox: number;
  margin: number;
  background: string;
  layers: QRLayer[];
  logo: { href: string; x: number; y: number; size: number; padding: number } | null;
}

const EYE_SIZE = 7;
// Kept ≥ 0.82: lower module opacity measurably hurts decoding (see scannability tests).
const OPACITY_LEVELS = [1, 0.94, 0.88, 0.82];
/** Sparse shapes cover less of each cell, so they get a narrower opacity range. */
const SPARSE_MAX_LEVEL = 1;

const f = (n: number) => Math.round(n * 1000) / 1000;

function roundedRect(x: number, y: number, w: number, h: number, r: number | [number, number, number, number]): string {
  const [tl, tr, br, bl] = typeof r === "number" ? [r, r, r, r] : r;
  return (
    `M${f(x + tl)} ${f(y)}H${f(x + w - tr)}` +
    (tr ? `A${f(tr)} ${f(tr)} 0 0 1 ${f(x + w)} ${f(y + tr)}` : "") +
    `V${f(y + h - br)}` +
    (br ? `A${f(br)} ${f(br)} 0 0 1 ${f(x + w - br)} ${f(y + h)}` : "") +
    `H${f(x + bl)}` +
    (bl ? `A${f(bl)} ${f(bl)} 0 0 1 ${f(x)} ${f(y + h - bl)}` : "") +
    `V${f(y + tl)}` +
    (tl ? `A${f(tl)} ${f(tl)} 0 0 1 ${f(x + tl)} ${f(y)}` : "") +
    "Z"
  );
}

function circle(cx: number, cy: number, r: number): string {
  return `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(r * 2)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-r * 2)} 0Z`;
}

export function modulePath(pattern: QRPattern, x: number, y: number): string {
  switch (pattern) {
    case "squares":
      return roundedRect(x + 0.04, y + 0.04, 0.92, 0.92, 0);
    case "rounded":
      return roundedRect(x + 0.07, y + 0.07, 0.86, 0.86, 0.14);
    case "dots":
      return circle(x + 0.5, y + 0.5, 0.5);
    case "diamond":
      // Slightly oversized so neighbouring diamonds overlap into scannable runs.
      return `M${f(x + 0.5)} ${f(y - 0.16)}L${f(x + 1.16)} ${f(y + 0.5)}L${f(x + 0.5)} ${f(y + 1.16)}L${f(x - 0.16)} ${f(y + 0.5)}Z`;
  }
}

interface EyePaths {
  frame: string;
  ball: string;
  frameRule?: "evenodd";
}

export function eyePaths(shape: QREyeShape, pattern: QRPattern, ox: number, oy: number): EyePaths {
  switch (shape) {
    case "rounded":
      // Solid frame and ball. The Figma mockups draw finders as separate tiles,
      // but any gap inside a finder breaks the 1:1:3:1:1 ratio and diagonal
      // cross-checks scanners rely on (verified with jsQR), so we don't.
      return {
        frame: roundedRect(ox, oy, 7, 7, pattern === "squares" ? 0.9 : 1.6) + roundedRect(ox + 1, oy + 1, 5, 5, pattern === "squares" ? 0.4 : 0.9),
        ball: roundedRect(ox + 2, oy + 2, 3, 3, pattern === "squares" ? 0.3 : 0.75),
        frameRule: "evenodd",
      };
    case "classic":
      return {
        frame: roundedRect(ox, oy, 7, 7, 0) + roundedRect(ox + 1, oy + 1, 5, 5, 0),
        ball: roundedRect(ox + 2, oy + 2, 3, 3, 0),
        frameRule: "evenodd",
      };
    case "leaf":
      return {
        frame: roundedRect(ox, oy, 7, 7, [2.6, 0.4, 2.6, 0.4]) + roundedRect(ox + 1, oy + 1, 5, 5, [1.7, 0.2, 1.7, 0.2]),
        ball: roundedRect(ox + 2, oy + 2, 3, 3, [1.2, 0.2, 1.2, 0.2]),
        frameRule: "evenodd",
      };
    case "innerDot":
      return {
        frame: roundedRect(ox, oy, 7, 7, 2.2) + roundedRect(ox + 1, oy + 1, 5, 5, 1.4),
        ball: circle(ox + 3.5, oy + 3.5, 1.5),
        frameRule: "evenodd",
      };
  }
}

function isInEye(r: number, c: number, size: number): boolean {
  const inBand = (v: number, start: number) => v >= start && v < start + EYE_SIZE;
  return (
    (inBand(r, 0) && inBand(c, 0)) ||
    (inBand(r, 0) && inBand(c, size - EYE_SIZE)) ||
    (inBand(r, size - EYE_SIZE) && inBand(c, 0))
  );
}

export interface BuildOptions {
  margin?: number;
}

export function buildQRGeometry(payload: string, style: QRStyle, options: BuildOptions = {}): QRGeometry {
  const margin = options.margin ?? 0;
  const qr = QRCodeLib.create(payload || " ", {
    errorCorrectionLevel: style.logo ? "H" : "M",
  });
  const size = qr.modules.size;
  const data = qr.modules.data;
  // Function patterns (timing, alignment, format info) keep a solid tile shape
  // so sparse patterns like dots/diamonds remain decodable.
  const reserved = qr.modules.reservedBit;
  const functionShape: QRPattern = style.pattern === "squares" ? "squares" : "rounded";
  const rand = seededRandom(hashString(payload));

  // Logo occupies a centered square; modules underneath are cleared.
  let logo: QRGeometry["logo"] = null;
  let logoMin = Infinity;
  let logoMax = -Infinity;
  if (style.logo) {
    const logoSize = Math.max(5, Math.round(size * 0.2) | 1);
    logoMin = Math.floor((size - logoSize) / 2);
    logoMax = logoMin + logoSize;
    logo = { href: style.logo, x: logoMin + margin, y: logoMin + margin, size: logoSize, padding: 0.5 };
  }

  const buckets = OPACITY_LEVELS.map(() => "");
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!data[r * size + c] || isInEye(r, c, size)) continue;
      if (r >= logoMin && r < logoMax && c >= logoMin && c < logoMax && !reserved[r * size + c]) continue;
      const sparse = style.pattern === "dots" || style.pattern === "diamond";
      // A logo already spends most of the error-correction budget, so skip texture then.
      const level = style.textured && !style.logo ? Math.min(sparse ? SPARSE_MAX_LEVEL : OPACITY_LEVELS.length - 1, Math.floor(rand() * OPACITY_LEVELS.length)) : 0;
      const shape = reserved[r * size + c] ? functionShape : style.pattern;
      buckets[level] += modulePath(shape, c + margin, r + margin);
    }
  }

  const layers: QRLayer[] = buckets
    .map((d, i) => ({ d, fill: style.foreground, opacity: OPACITY_LEVELS[i] }))
    .filter((l) => l.d);

  const eyeOrigins: [number, number][] = [
    [0, 0],
    [size - EYE_SIZE, 0],
    [0, size - EYE_SIZE],
  ];
  let frames = "";
  let balls = "";
  let frameRule: "evenodd" | undefined;
  for (const [x, y] of eyeOrigins) {
    const eye = eyePaths(style.eyeShape, style.pattern, x + margin, y + margin);
    frames += eye.frame;
    balls += eye.ball;
    frameRule = eye.frameRule;
  }
  layers.push({ d: frames, fill: style.foreground, opacity: 1, fillRule: frameRule });
  layers.push({ d: balls, fill: readableEyeColor(style.eyeColor, style.background, style.foreground), opacity: 1 });

  return { size, viewBox: size + margin * 2, margin, background: style.background, layers, logo };
}
