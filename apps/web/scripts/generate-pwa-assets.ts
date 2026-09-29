/**
 * Generates every PWA / home-screen asset from the Qdot logo mark (the same
 * geometry as <LogoMark />): install icons, maskable + monochrome Android icons,
 * the Apple touch icon, iOS launch screens and favicon.ico.
 *
 *   pnpm --filter web pwa:assets
 *
 * Output is committed (public/pwa, src/app/favicon.ico) so builds don't depend on this script.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import { IOS_SPLASH_SCREENS, PWA_COLORS } from "../src/lib/pwa/assets";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "public/pwa");
mkdirSync(join(out, "splash"), { recursive: true });

const { background, mark, markInner, markDot } = PWA_COLORS;

/** The logo mark on a 32-unit grid: white tile, dark square, light dot. */
function markSvg(x: number, y: number, size: number, mono = false): string {
  const u = size / 32;
  const r = (v: number) => (v * u).toFixed(2);
  const tile = `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${r(8)}" fill="${mono ? "#fff" : mark}"/>`;
  if (mono) {
    // Themed icons are a single-color silhouette: cut the inner square out, keep the dot.
    return (
      `<path fill="#fff" fill-rule="evenodd" d="M${x + 8 * u} ${y}h${16 * u}a${8 * u} ${8 * u} 0 0 1 ${8 * u} ${8 * u}v${16 * u}a${8 * u} ${8 * u} 0 0 1 -${8 * u} ${8 * u}h-${16 * u}a${8 * u} ${8 * u} 0 0 1 -${8 * u} -${8 * u}v-${16 * u}a${8 * u} ${8 * u} 0 0 1 ${8 * u} -${8 * u}z` +
      `M${x + 12 * u} ${y + 8 * u}h${8 * u}a${4 * u} ${4 * u} 0 0 1 ${4 * u} ${4 * u}v${8 * u}a${4 * u} ${4 * u} 0 0 1 -${4 * u} ${4 * u}h-${8 * u}a${4 * u} ${4 * u} 0 0 1 -${4 * u} -${4 * u}v-${8 * u}a${4 * u} ${4 * u} 0 0 1 ${4 * u} -${4 * u}z"/>` +
      `<rect x="${x + 13 * u}" y="${y + 13 * u}" width="${r(6)}" height="${r(6)}" rx="${r(1)}" fill="#fff"/>`
    );
  }
  return (
    tile +
    `<rect x="${x + 8 * u}" y="${y + 8 * u}" width="${r(16)}" height="${r(16)}" rx="${r(4)}" fill="${markInner}"/>` +
    `<rect x="${x + 13 * u}" y="${y + 13 * u}" width="${r(6)}" height="${r(6)}" rx="${r(1)}" fill="${markDot}"/>`
  );
}

function png(width: number, height: number, body: string): Buffer {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`;
  return Buffer.from(new Resvg(svg, { fitTo: { mode: "original" } }).render().asPng());
}

const bg = (w: number, h: number) => `<rect width="${w}" height="${h}" fill="${background}"/>`;
const centered = (w: number, h: number, size: number, mono = false) => markSvg((w - size) / 2, (h - size) / 2, size, mono);

function write(name: string, data: Buffer) {
  writeFileSync(join(out, name), data);
  console.log(`  ${name.padEnd(34)} ${(data.length / 1024).toFixed(1)} kB`);
}

// "any" icons: the mark itself, transparent corners (desktop, Android launcher fallback).
for (const size of [192, 512]) write(`icon-${size}.png`, png(size, size, centered(size, size, size * 0.875)));
// Maskable: full-bleed background, mark inside the 80 % safe zone.
for (const size of [192, 512]) write(`icon-maskable-${size}.png`, png(size, size, bg(size, size) + centered(size, size, size * 0.52)));
// Android 13+ themed icons.
write("icon-monochrome-512.png", png(512, 512, centered(512, 512, 512 * 0.52, true)));
// iOS rounds the corners itself and ignores transparency: full-bleed background.
write("apple-touch-icon.png", png(180, 180, bg(180, 180) + centered(180, 180, 180 * 0.58)));

// iOS launch screens (portrait): background + mark, shown while the standalone app boots.
for (const s of IOS_SPLASH_SCREENS) {
  const w = s.width * s.ratio;
  const h = s.height * s.ratio;
  write(`splash/${w}x${h}.png`, png(w, h, bg(w, h) + centered(w, h, Math.round(w * 0.22))));
}

// favicon.ico with 16/32/48 px PNG entries (PNG-in-ICO is supported by every current browser).
const sizes = [16, 32, 48];
const images = sizes.map((s) => png(s, s, centered(s, s, s)));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((s, i) => {
  const e = 6 + 16 * i;
  header.writeUInt8(s, e);
  header.writeUInt8(s, e + 1);
  header.writeUInt16LE(1, e + 4);
  header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(images[i].length, e + 8);
  header.writeUInt32LE(offset, e + 12);
  offset += images[i].length;
});
writeFileSync(join(root, "src/app/favicon.ico"), Buffer.concat([header, ...images]));
console.log("  src/app/favicon.ico");
