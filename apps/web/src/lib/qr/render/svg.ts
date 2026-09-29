import type { QRDesign } from "@/types";
import { buildQRGeometry, gradientVector, type QRGeometry } from "./geometry";

const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/** `<linearGradient>` / `<radialGradient>` markup for the module fill, or "" for solid fills. */
export function gradientDef(g: QRGeometry, id: string): string {
  const fill = g.moduleFill;
  if (fill.type === "solid") return "";
  const v = gradientVector(g, fill.rotation);
  const stops = fill.stops.map((s) => `<stop offset="${s.offset}" stop-color="${esc(s.color)}"/>`).join("");
  return fill.type === "linear"
    ? `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${v.x1}" y1="${v.y1}" x2="${v.x2}" y2="${v.y2}">${stops}</linearGradient>`
    : `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${v.cx}" cy="${v.cy}" r="${v.r}">${stops}</radialGradient>`;
}

export function layerFill(g: QRGeometry, paint: QRGeometry["layers"][number]["paint"], gradientId: string): string {
  if (paint === "frame") return g.frameColor;
  if (paint === "center") return g.centerColor;
  return g.moduleFill.type === "solid" ? g.moduleFill.color : `url(#${gradientId})`;
}

/** Complete SVG document string (exports, PDF). Dimensions are in pixels; drawing stays vector. */
export function geometryToSvg(g: QRGeometry, pixelSize: number): string {
  const id = "qdot-fill";
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${pixelSize}" height="${pixelSize}" viewBox="0 0 ${g.viewBox} ${g.viewBox}" shape-rendering="geometricPrecision">`,
  ];
  const defs = gradientDef(g, id);
  if (defs) parts.push(`<defs>${defs}</defs>`);
  if (g.background) parts.push(`<rect width="${g.viewBox}" height="${g.viewBox}" fill="${esc(g.background)}"/>`);
  if (g.backgroundImage) {
    const { href, opacity } = g.backgroundImage;
    parts.push(
      `<image href="${esc(href)}" xlink:href="${esc(href)}" width="${g.viewBox}" height="${g.viewBox}" preserveAspectRatio="xMidYMid slice" opacity="${opacity}"/>`,
    );
  }
  for (const l of g.layers) {
    parts.push(
      `<path d="${l.d}" fill="${esc(layerFill(g, l.paint, id))}"${l.opacity < 1 ? ` fill-opacity="${l.opacity}"` : ""}${l.fillRule ? ` fill-rule="${l.fillRule}"` : ""}/>`,
    );
  }
  if (g.logo) {
    const { plate, href, x, y, size } = g.logo;
    if (plate) parts.push(`<path d="${plate.d}" fill="${esc(plate.color)}"/>`);
    parts.push(
      `<image href="${esc(href)}" xlink:href="${esc(href)}" x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/>`,
    );
  }
  parts.push("</svg>");
  return parts.join("");
}

export function qrToSvgString(payload: string, design: QRDesign, pixelSize = 1024): string {
  return geometryToSvg(buildQRGeometry(payload, design), pixelSize);
}
