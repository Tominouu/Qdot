import { EYE_CENTER_SHAPES, EYE_FRAME_SHAPES, type EyeCenterShape, type EyeFrameShape, type QRDesign } from "@/types";
import { circle, roundedRect, type Corners } from "./paths";

/**
 * Finder patterns ("eyes"): a 7×7 outer contour, a 5×5 hole (inner contour)
 * and a 3×3 center. Everything stays solid: any gap inside a finder breaks the
 * 1:1:3:1:1 ratio scanners look for.
 */

type Contour = (x: number, y: number, size: number) => string;

const LEAF = (s: number): Corners => [s * 0.37, s * 0.06, s * 0.37, s * 0.06];

const FRAME: Record<EyeFrameShape, { outer: Contour; inner: Contour }> = {
  square: { outer: (x, y, s) => roundedRect(x, y, s, s, 0), inner: (x, y, s) => roundedRect(x, y, s, s, 0) },
  rounded: { outer: (x, y, s) => roundedRect(x, y, s, s, 1.6), inner: (x, y, s) => roundedRect(x, y, s, s, 0.9) },
  circle: { outer: (x, y, s) => circle(x + s / 2, y + s / 2, s / 2), inner: (x, y, s) => circle(x + s / 2, y + s / 2, s / 2) },
  leaf: { outer: (x, y, s) => roundedRect(x, y, s, s, LEAF(s)), inner: (x, y, s) => roundedRect(x, y, s, s, LEAF(s)) },
};

const CENTER: Record<EyeCenterShape, Contour> = {
  square: (x, y, s) => roundedRect(x, y, s, s, 0),
  rounded: (x, y, s) => roundedRect(x, y, s, s, 0.75),
  // Slightly smaller than the 3×3 cell; still decodes (see the decode tests).
  dot: (x, y, s) => circle(x + s / 2, y + s / 2, s * 0.42),
  circle: (x, y, s) => circle(x + s / 2, y + s / 2, s / 2),
  leaf: (x, y, s) => roundedRect(x, y, s, s, LEAF(s)),
};

export interface EyePaths {
  /** Outer contour + hole, drawn with fill-rule evenodd. */
  frame: string;
  center: string;
}

export function eyePaths(outer: EyeFrameShape, inner: EyeFrameShape, center: EyeCenterShape, ox: number, oy: number): EyePaths {
  // A square-cornered hole pokes through a circular outline: round it enough to keep the ring closed.
  const holeInCircle = outer === "circle" && inner !== "circle";
  const hole = holeInCircle ? roundedRect(ox + 1, oy + 1, 5, 5, 1) : FRAME[inner].inner(ox + 1, oy + 1, 5);
  return {
    frame: FRAME[outer].outer(ox, oy, 7) + hole,
    center: CENTER[center](ox + 2, oy + 2, 3),
  };
}

/* ------------------------------------------------------------------ */
/* Combination reliability                                             */
/* ------------------------------------------------------------------ */

/**
 * Finder combinations that fail to decode. Scanners (jsQR, ZXing) score each
 * finder along the horizontal, vertical and both diagonals; mixing contours
 * whose diagonal extents disagree (e.g. a square frame around a round center)
 * breaks the diagonal 1:1:3:1:1 ratio. Measured by rendering every combination
 * and decoding it; `decode.test.ts` re-checks that every combination NOT listed
 * here decodes, so this table can't silently drift.
 */
const UNRELIABLE = new Set([
  "square/square/dot", "square/square/circle", "square/rounded/dot", "square/rounded/circle",
  "square/circle/square", "square/circle/rounded", "square/circle/dot", "square/circle/circle", "square/circle/leaf",
  "square/leaf/square", "square/leaf/rounded", "square/leaf/dot", "square/leaf/circle", "square/leaf/leaf",
  "rounded/square/dot", "rounded/square/circle", "rounded/rounded/dot", "rounded/circle/square", "rounded/circle/dot", "rounded/leaf/dot",
  "circle/square/square", "circle/square/dot", "circle/rounded/square", "circle/rounded/dot", "circle/circle/square", "circle/leaf/square", "circle/leaf/dot",
  // Decode with solid fills but fail with some gradients: kept out to stay safe.
  "circle/square/circle", "circle/rounded/circle", "circle/leaf/circle",
  "leaf/square/square", "leaf/square/rounded", "leaf/square/dot", "leaf/square/circle", "leaf/square/leaf", "leaf/rounded/dot", "leaf/circle/square",
]);

type Eyes = Pick<QRDesign["eyes"], "outer" | "inner" | "center">;
export type EyePart = keyof Eyes;

export const isReliableEyeCombo = (e: Eyes) => !UNRELIABLE.has(`${e.outer}/${e.inner}/${e.center}`);

/**
 * After the user picks `part`, the closest reliable combination that keeps
 * their choice: other parts change only if needed, preferring to keep the
 * center, then shapes matching the one just picked.
 */
export function reliableEyes(eyes: Eyes, part: EyePart): Eyes {
  if (isReliableEyeCombo(eyes)) return eyes;
  let best: Eyes = eyes;
  let bestScore = -Infinity;
  for (const outer of EYE_FRAME_SHAPES)
    for (const inner of EYE_FRAME_SHAPES)
      for (const center of EYE_CENTER_SHAPES) {
        const candidate = { outer, inner, center };
        if (candidate[part] !== eyes[part] || !isReliableEyeCombo(candidate)) continue;
        const picked = eyes[part] as string;
        const score =
          (outer === eyes.outer ? 4 : 0) + (inner === eyes.inner ? 3 : 0) + (center === eyes.center ? 5 : 0) +
          (outer === picked ? 1 : 0) + (inner === picked ? 1 : 0) + (center === picked ? 1 : 0);
        if (score > bestScore) [best, bestScore] = [candidate, score];
      }
  return best;
}
