import type { ModuleShape } from "@/types";
import { circle, f, roundedRect, type Corners } from "./paths";

/** Which of the four orthogonal neighbours are dark. */
export interface Neighbours {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
}

export interface ModuleShapeDef {
  /** Path for the module whose top-left corner is (x, y), in module units. */
  path: (x: number, y: number, n: Neighbours) => string;
  /**
   * Shapes that leave much of each cell empty. Function patterns (timing,
   * alignment, format info) then keep a solid tile so scanners can lock on,
   * and texture uses a narrower opacity range.
   */
  sparse?: boolean;
}

/** Tiny overlap so connected shapes don't show anti-aliasing seams between cells. */
const E = 0.012;

/** Rounds a corner only when both sides touching it are empty. */
function exposedCorners(n: Neighbours, r: number, which: Partial<Record<"tl" | "tr" | "br" | "bl", boolean>> = {}): Corners {
  const tl = !n.top && !n.left && which.tl !== false ? r : 0;
  const tr = !n.top && !n.right && which.tr !== false ? r : 0;
  const br = !n.bottom && !n.right && which.br !== false ? r : 0;
  const bl = !n.bottom && !n.left && which.bl !== false ? r : 0;
  return [tl, tr, br, bl];
}

/**
 * Module shape registry. Add a shape by adding its id to MODULE_SHAPES
 * (packages/types) and an entry here; the editor lists them automatically.
 */
export const MODULE_SHAPE_DEFS: Record<ModuleShape, ModuleShapeDef> = {
  square: { path: (x, y) => roundedRect(x - E, y - E, 1 + 2 * E, 1 + 2 * E, 0) },
  // Independent soft tiles (the original Qdot look).
  rounded: { path: (x, y) => roundedRect(x + 0.07, y + 0.07, 0.86, 0.86, 0.14) },
  dots: { path: (x, y) => circle(x + 0.5, y + 0.5, 0.4), sparse: true },
  circle: { path: (x, y) => circle(x + 0.5, y + 0.5, 0.5), sparse: true },
  diamond: {
    // Slightly oversized so neighbouring diamonds overlap into scannable runs.
    path: (x, y) => `M${f(x + 0.5)} ${f(y - 0.16)}L${f(x + 1.16)} ${f(y + 0.5)}L${f(x + 0.5)} ${f(y + 1.16)}L${f(x - 0.16)} ${f(y + 0.5)}Z`,
    sparse: true,
  },
  // Connected shapes: corners round only where the module is exposed.
  "extra-rounded": { path: (x, y, n) => roundedRect(x - E, y - E, 1 + 2 * E, 1 + 2 * E, exposedCorners(n, 0.5)) },
  classy: { path: (x, y, n) => roundedRect(x - E, y - E, 1 + 2 * E, 1 + 2 * E, exposedCorners(n, 0.5, { tr: false, bl: false })) },
  "classy-rounded": {
    path: (x, y, n) => {
      const [tl, , br] = exposedCorners(n, 0.5);
      const [, tr, , bl] = exposedCorners(n, 0.18);
      return roundedRect(x - E, y - E, 1 + 2 * E, 1 + 2 * E, [tl, tr, br, bl]);
    },
  },
};
