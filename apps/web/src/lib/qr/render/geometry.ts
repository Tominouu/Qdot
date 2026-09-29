import QRCodeLib from "qrcode";
import { resolveErrorCorrection, type ErrorCorrectionLevel, type QRDesign, type QRFill } from "@/types";
import { hashString, seededRandom } from "@/lib/utils/seeded-random";
import { readableEyeColor } from "../scannability";
import { eyePaths } from "./eyes";
import { circle, roundedRect } from "./paths";
import { MODULE_SHAPE_DEFS } from "./shapes";

/**
 * Payload + design → drawable geometry (SVG path data in module units).
 * Every output (on-screen <StyledQR>, SVG/PNG/PDF export) renders this, so what
 * users see is exactly what they download.
 */

export type LayerPaint = "modules" | "frame" | "center";

export interface QRLayer {
  d: string;
  paint: LayerPaint;
  opacity: number;
  fillRule?: "evenodd";
}

export interface QRGeometry {
  /** Modules per side, without margin. */
  size: number;
  version: number;
  errorCorrection: ErrorCorrectionLevel;
  /** viewBox edge including the margin (quiet zone). */
  viewBox: number;
  margin: number;
  /** null = transparent. */
  background: string | null;
  backgroundImage: { href: string; opacity: number } | null;
  /** Solid color or gradient for the data modules (gradient coordinates span the symbol). */
  moduleFill: QRFill;
  frameColor: string;
  centerColor: string;
  layers: QRLayer[];
  logo: {
    href: string;
    /** Image box. */
    x: number;
    y: number;
    size: number;
    plate: { color: string; shape: "square" | "rounded" | "circle"; d: string } | null;
  } | null;
}

const EYE_SIZE = 7;
// Kept ≥ 0.82: lower module opacity measurably hurts decoding.
const OPACITY_LEVELS = [1, 0.94, 0.88, 0.82];
const SPARSE_MAX_LEVEL = 1;

function isInEye(r: number, c: number, size: number): boolean {
  const inBand = (v: number, start: number) => v >= start && v < start + EYE_SIZE;
  return (inBand(r, 0) && inBand(c, 0)) || (inBand(r, 0) && inBand(c, size - EYE_SIZE)) || (inBand(r, size - EYE_SIZE) && inBand(c, 0));
}

/** Size of the logo plate in modules: odd so it stays centered on the module grid. */
export function logoPlateModules(size: number, logoSize: number): number {
  return Math.max(3, Math.round(size * logoSize) | 1);
}

export interface BuildOptions {
  /** Override the design margin (cards draw edge-to-edge inside their own padding). */
  margin?: number;
}

export function buildQRGeometry(payload: string, design: QRDesign, options: BuildOptions = {}): QRGeometry {
  const margin = options.margin ?? design.margin;
  const errorCorrection = resolveErrorCorrection(design);
  const qr = QRCodeLib.create(payload || " ", { errorCorrectionLevel: errorCorrection });
  const size = qr.modules.size;
  const data = qr.modules.data;
  const reserved = qr.modules.reservedBit;
  const shape = MODULE_SHAPE_DEFS[design.modules.shape];
  // Sparse shapes keep function patterns as solid tiles so scanners can lock on.
  const functionShape = shape.sparse ? MODULE_SHAPE_DEFS.rounded : shape;
  const rand = seededRandom(hashString(payload));

  // Logo plate: modules underneath are cleared (except function patterns, which the plate covers anyway).
  let logo: QRGeometry["logo"] = null;
  let cleared: (r: number, c: number) => boolean = () => false;
  if (design.logo) {
    const plate = logoPlateModules(size, design.logo.size);
    const min = (size - plate) / 2;
    const center = size / 2;
    const { shape: plateShape } = design.logo;
    cleared =
      plateShape === "circle"
        ? (r, c) => Math.hypot(r + 0.5 - center, c + 0.5 - center) <= plate / 2 + 0.2
        : (r, c) => r >= min && r < min + plate && c >= min && c < min + plate;
    const px = min + margin;
    const inset = Math.min(design.logo.margin, plate / 2 - 0.5);
    logo = {
      href: design.logo.src,
      x: px + inset,
      y: px + inset,
      size: plate - inset * 2,
      plate: design.logo.background
        ? {
            color: design.logo.background,
            shape: plateShape,
            d:
              plateShape === "circle"
                ? circle(px + plate / 2, px + plate / 2, plate / 2)
                : roundedRect(px, px, plate, plate, plateShape === "rounded" ? Math.min(1, plate * 0.18) : 0),
          }
        : null,
    };
  }

  const dark = (r: number, c: number) =>
    r >= 0 && c >= 0 && r < size && c < size && data[r * size + c] === 1 && !isInEye(r, c, size) && !(cleared(r, c) && !reserved[r * size + c]);

  // Texture spends error-correction budget, so it's skipped whenever something already covers modules.
  const texture = design.modules.textured && !design.logo && !design.background.image;
  const buckets = OPACITY_LEVELS.map(() => "");
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!dark(r, c)) continue;
      const def = reserved[r * size + c] ? functionShape : shape;
      const level = texture ? Math.min(shape.sparse ? SPARSE_MAX_LEVEL : OPACITY_LEVELS.length - 1, Math.floor(rand() * OPACITY_LEVELS.length)) : 0;
      buckets[level] += def.path(c + margin, r + margin, {
        top: dark(r - 1, c),
        right: dark(r, c + 1),
        bottom: dark(r + 1, c),
        left: dark(r, c - 1),
      });
    }
  }

  const layers: QRLayer[] = buckets.map((d, i) => ({ d, paint: "modules" as const, opacity: OPACITY_LEVELS[i] })).filter((l) => l.d);

  let frames = "";
  let centers = "";
  for (const [x, y] of [
    [0, 0],
    [size - EYE_SIZE, 0],
    [0, size - EYE_SIZE],
  ]) {
    const eye = eyePaths(design.eyes.outer, design.eyes.inner, design.eyes.center, x + margin, y + margin);
    frames += eye.frame;
    centers += eye.center;
  }
  layers.push({ d: frames, paint: "frame", opacity: 1, fillRule: "evenodd" });
  layers.push({ d: centers, paint: "center", opacity: 1 });

  const background = design.background.transparent ? null : design.background.color;
  return {
    size,
    version: qr.version,
    errorCorrection,
    viewBox: size + margin * 2,
    margin,
    background,
    backgroundImage: design.background.image ? { href: design.background.image.src, opacity: design.background.image.opacity } : null,
    moduleFill: design.modules.fill,
    frameColor: design.eyes.frameColor,
    // Nudge the center toward the frame color just enough to stay decodable (keeps the coral signature legible).
    centerColor: background ? readableEyeColor(design.eyes.centerColor, background, design.eyes.frameColor) : design.eyes.centerColor,
    layers,
    logo,
  };
}

/** Gradient endpoints in user space (the symbol, without margin), for `gradientUnits="userSpaceOnUse"`. */
export function gradientVector(g: QRGeometry, rotation: number) {
  const mid = g.viewBox / 2;
  const half = g.size / 2;
  const rad = (rotation * Math.PI) / 180;
  const dx = Math.cos(rad) * half;
  const dy = Math.sin(rad) * half;
  return { x1: mid - dx, y1: mid - dy, x2: mid + dx, y2: mid + dy, cx: mid, cy: mid, r: half * Math.SQRT2 };
}
