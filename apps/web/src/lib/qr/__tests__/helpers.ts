import { Resvg } from "@resvg/resvg-js";
import jsQR from "jsqr";
import { buildQRGeometry } from "../render/geometry";
import { geometryToSvg } from "../render/svg";
import type { QRDesign } from "@/types";

/** Rasterizes an SVG string like a printer/screen would, then reads it like a phone camera. */
export function decodeSvg(svg: string, size = 480, background = "#FFFFFF"): string | null {
  const png = new Resvg(svg, { fitTo: { mode: "width", value: size }, background }).render();
  const code = jsQR(new Uint8ClampedArray(png.pixels), png.width, png.height, { inversionAttempts: "attemptBoth" });
  return code?.data ?? null;
}

export function decodeDesign(payload: string, design: QRDesign, size = 480): string | null {
  return decodeSvg(geometryToSvg(buildQRGeometry(payload, design), size), size);
}

/** A real PNG logo (coral disc on white), as a data URL like an upload would produce. */
export const LOGO_DATA_URL = (() => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#fff"/><circle cx="32" cy="32" r="26" fill="#E8503A"/></svg>`;
  return `data:image/png;base64,${Buffer.from(new Resvg(svg).render().asPng()).toString("base64")}`;
})();
