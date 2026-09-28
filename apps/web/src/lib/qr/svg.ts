import type { QRStyle } from "@/types";
import { buildQRGeometry } from "./geometry";

const escapeAttr = (v: string) => v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/** Standalone SVG document for downloads. Includes a quiet zone for reliable scanning. */
export function qrToSvgString(payload: string, style: QRStyle, pixelSize = 1024): string {
  const g = buildQRGeometry(payload, style, { margin: 3 });
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${pixelSize}" height="${pixelSize}" viewBox="0 0 ${g.viewBox} ${g.viewBox}" shape-rendering="geometricPrecision">`,
    `<rect width="${g.viewBox}" height="${g.viewBox}" fill="${escapeAttr(g.background)}"/>`,
    ...g.layers.map(
      (l) =>
        `<path d="${l.d}" fill="${escapeAttr(l.fill)}"${l.opacity < 1 ? ` fill-opacity="${l.opacity}"` : ""}${l.fillRule ? ` fill-rule="${l.fillRule}"` : ""}/>`,
    ),
  ];
  if (g.logo) {
    const { x, y, size, padding, href } = g.logo;
    parts.push(
      `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="1" fill="${escapeAttr(g.background)}"/>`,
      `<image href="${escapeAttr(href)}" x="${x + padding}" y="${y + padding}" width="${size - padding * 2}" height="${size - padding * 2}" preserveAspectRatio="xMidYMid meet"/>`,
    );
  }
  parts.push("</svg>");
  return parts.join("");
}
